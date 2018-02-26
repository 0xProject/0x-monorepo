import findVersions = require('find-versions');
import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import semverSort = require('semver-sort');
import { TopBar } from 'ts/components/top_bar/top_bar';
import { DocsInfo } from 'ts/pages/documentation/docs_info';
import { Documentation } from 'ts/pages/documentation/documentation';
import { Dispatcher } from 'ts/redux/dispatcher';
import { DocAgnosticFormat, DoxityDocObj, MenuSubsectionsBySection } from 'ts/types';
import { docUtils } from 'ts/utils/doc_utils';
import { Translate } from 'ts/utils/translate';

export interface DocPageProps {
    location: Location;
    dispatcher: Dispatcher;
    docsVersion: string;
    availableDocVersions: string[];
    docsInfo: DocsInfo;
    translate: Translate;
}

interface DocPageState {
    docAgnosticFormat?: DocAgnosticFormat;
}

export class DocPage extends React.Component<DocPageProps, DocPageState> {
    private _isUnmounted: boolean;
    constructor(props: DocPageProps) {
        super(props);
        this._isUnmounted = false;
        this.state = {
            docAgnosticFormat: undefined,
        };
    }
    public componentWillMount() {
        const pathName = this.props.location.pathname;
        const lastSegment = pathName.substr(pathName.lastIndexOf('/') + 1);
        const versions = findVersions(lastSegment);
        const preferredVersionIfExists = versions.length > 0 ? versions[0] : undefined;
        // tslint:disable-next-line:no-floating-promises
        this._fetchJSONDocsFireAndForgetAsync(preferredVersionIfExists);
    }
    public componentWillUnmount() {
        this._isUnmounted = true;
    }

    public render() {
        const menuSubsectionsBySection = _.isUndefined(this.state.docAgnosticFormat)
            ? {}
            : this.props.docsInfo.getMenuSubsectionsBySection(this.state.docAgnosticFormat);
        return (
            <div>
                <DocumentTitle title={`${this.props.docsInfo.displayName} Documentation`} />
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    docsVersion={this.props.docsVersion}
                    availableDocVersions={this.props.availableDocVersions}
                    menu={this.props.docsInfo.getMenu(this.props.docsVersion)}
                    menuSubsectionsBySection={menuSubsectionsBySection}
                    docsInfo={this.props.docsInfo}
                    translate={this.props.translate}
                />
                <Documentation
                    location={this.props.location}
                    docsVersion={this.props.docsVersion}
                    availableDocVersions={this.props.availableDocVersions}
                    docsInfo={this.props.docsInfo}
                    docAgnosticFormat={this.state.docAgnosticFormat}
                    menuSubsectionsBySection={menuSubsectionsBySection}
                />
            </div>
        );
    }
    private async _fetchJSONDocsFireAndForgetAsync(preferredVersionIfExists?: string): Promise<void> {
        const versionToFileName = await docUtils.getVersionToFileNameAsync(this.props.docsInfo.docsJsonRoot);
        const versions = _.keys(versionToFileName);
        this.props.dispatcher.updateAvailableDocVersions(versions);
        const sortedVersions = semverSort.desc(versions);
        const latestVersion = sortedVersions[0];

        let versionToFetch = latestVersion;
        if (!_.isUndefined(preferredVersionIfExists)) {
            const preferredVersionFileNameIfExists = versionToFileName[preferredVersionIfExists];
            if (!_.isUndefined(preferredVersionFileNameIfExists)) {
                versionToFetch = preferredVersionIfExists;
            }
        }
        this.props.dispatcher.updateCurrentDocsVersion(versionToFetch);

        const versionFileNameToFetch = versionToFileName[versionToFetch];
        const versionDocObj = await docUtils.getJSONDocFileAsync(
            versionFileNameToFetch,
            this.props.docsInfo.docsJsonRoot,
        );
        const docAgnosticFormat = this.props.docsInfo.convertToDocAgnosticFormat(versionDocObj as DoxityDocObj);

        if (!this._isUnmounted) {
            this.setState({
                docAgnosticFormat,
            });
        }
    }
}
