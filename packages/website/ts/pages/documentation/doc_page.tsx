import { DocAgnosticFormat, DocsInfo, Documentation, DoxityDocObj } from '@0xproject/react-docs';
import { MenuSubsectionsBySection } from '@0xproject/react-shared';
import findVersions = require('find-versions');
import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import semverSort = require('semver-sort');
import { SidebarHeader } from 'ts/components/sidebar_header';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { Dispatcher } from 'ts/redux/dispatcher';
import { DocPackages } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { docUtils } from 'ts/utils/doc_utils';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

const isDevelopmentOrStaging = utils.isDevelopment() || utils.isStaging();
const DEFAULT_ICON = 'docs.png';
const ZERO_EX_JS_VERSION_MISSING_TOPLEVEL_PATH = '0.32.4';

const idToIcon: { [id: string]: string } = {
    [DocPackages.ZeroExJs]: 'zeroExJs.png',
    [DocPackages.Connect]: 'connect.png',
    [DocPackages.SmartContracts]: 'contracts.png',
};

const docIdToSubpackageName: { [id: string]: string } = {
    [DocPackages.ZeroExJs]: '0x.js',
    [DocPackages.Connect]: 'connect',
    [DocPackages.SmartContracts]: 'contracts',
    [DocPackages.Web3Wrapper]: 'web3-wrapper',
    [DocPackages.SolCompiler]: 'sol-compiler',
    [DocPackages.JSONSchemas]: 'json-schemas',
    [DocPackages.SolCov]: 'sol-cov',
    [DocPackages.Subproviders]: 'subproviders',
    [DocPackages.OrderUtils]: 'order-utils',
};

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
    public componentWillMount(): void {
        const pathName = this.props.location.pathname;
        const lastSegment = pathName.substr(pathName.lastIndexOf('/') + 1);
        const versions = findVersions(lastSegment);
        const preferredVersionIfExists = versions.length > 0 ? versions[0] : undefined;
        // tslint:disable-next-line:no-floating-promises
        this._fetchJSONDocsFireAndForgetAsync(preferredVersionIfExists);
    }
    public componentWillUnmount(): void {
        this._isUnmounted = true;
    }
    public render(): React.ReactNode {
        const menuSubsectionsBySection = _.isUndefined(this.state.docAgnosticFormat)
            ? {}
            : this.props.docsInfo.getMenuSubsectionsBySection(this.state.docAgnosticFormat);
        const sourceUrl = this._getSourceUrl();
        const iconFileName = idToIcon[this.props.docsInfo.id] || DEFAULT_ICON;
        const iconUrl = `/images/doc_icons/${iconFileName}`;
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
                    onVersionSelected={this._onVersionSelected.bind(this)}
                    sidebarHeader={<SidebarHeader title={this.props.docsInfo.displayName} iconUrl={iconUrl} />}
                />
                <Documentation
                    selectedVersion={this.props.docsVersion}
                    availableVersions={this.props.availableDocVersions}
                    docsInfo={this.props.docsInfo}
                    docAgnosticFormat={this.state.docAgnosticFormat}
                    sidebarHeader={<SidebarHeader title={this.props.docsInfo.displayName} iconUrl={iconUrl} />}
                    sourceUrl={sourceUrl}
                    topBarHeight={60}
                    onVersionSelected={this._onVersionSelected.bind(this)}
                />
            </div>
        );
    }
    private async _fetchJSONDocsFireAndForgetAsync(preferredVersionIfExists?: string): Promise<void> {
        const folderName = docIdToSubpackageName[this.props.docsInfo.id];
        const docBucketRoot = isDevelopmentOrStaging
            ? constants.S3_STAGING_DOC_BUCKET_ROOT
            : constants.S3_DOC_BUCKET_ROOT;
        const versionToFilePath = await docUtils.getVersionToFilePathAsync(docBucketRoot, folderName);
        const versions = _.keys(versionToFilePath);
        this.props.dispatcher.updateAvailableDocVersions(versions);
        const sortedVersions = semverSort.desc(versions);
        const latestVersion = sortedVersions[0];

        let versionToFetch = latestVersion;
        if (!_.isUndefined(preferredVersionIfExists)) {
            const preferredVersionFileNameIfExists = versionToFilePath[preferredVersionIfExists];
            if (!_.isUndefined(preferredVersionFileNameIfExists)) {
                versionToFetch = preferredVersionIfExists;
            }
        }
        this.props.dispatcher.updateCurrentDocsVersion(versionToFetch);

        const versionFilePathToFetch = versionToFilePath[versionToFetch];
        const versionDocObj = await docUtils.getJSONDocFileAsync(versionFilePathToFetch, docBucketRoot);
        const docAgnosticFormat = this.props.docsInfo.convertToDocAgnosticFormat(versionDocObj);

        if (!this._isUnmounted) {
            this.setState({
                docAgnosticFormat,
            });
        }
    }
    private _getSourceUrl(): string {
        const url = this.props.docsInfo.packageUrl;
        let pkg = docIdToSubpackageName[this.props.docsInfo.id];
        let tagPrefix = pkg;
        const packagesWithNamespace = ['connect'];
        if (_.includes(packagesWithNamespace, pkg)) {
            tagPrefix = `@0xproject/${pkg}`;
        }
        // HACK: The following three lines exist for backward compatibility reasons
        // Before exporting types from other packages as part of the 0x.js interface,
        // all TypeDoc generated paths omitted the topLevel `0x.js` segment. Now it
        // adds it, and for that reason, we need to make sure we don't add it twice in
        // the source links we generate.
        const semvers = semverSort.desc([this.props.docsVersion, ZERO_EX_JS_VERSION_MISSING_TOPLEVEL_PATH]);
        const isVersionAfterTopLevelPathChange = semvers[0] !== ZERO_EX_JS_VERSION_MISSING_TOPLEVEL_PATH;
        pkg = this.props.docsInfo.id === DocPackages.ZeroExJs && isVersionAfterTopLevelPathChange ? '' : `/${pkg}`;

        const sourceUrl = `${url}/blob/${tagPrefix}%40${this.props.docsVersion}/packages${pkg}`;
        return sourceUrl;
    }
    private _onVersionSelected(semver: string): void {
        let path = window.location.pathname;
        const lastChar = path[path.length - 1];
        if (_.isFinite(_.parseInt(lastChar))) {
            const pathSections = path.split('/');
            pathSections.pop();
            path = pathSections.join('/');
        }
        const baseUrl = utils.getCurrentBaseUrl();
        window.location.href = `${baseUrl}${path}/${semver}${window.location.hash}`;
    }
}
