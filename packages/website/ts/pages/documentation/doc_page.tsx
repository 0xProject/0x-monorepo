import {
    DocAgnosticFormat,
    DocReference,
    DocsInfo,
    GeneratedDocJson,
    SupportedDocJson,
    TypeDocUtils,
} from '@0x/react-docs';
import findVersions = require('find-versions');
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import * as React from 'react';
import semverSort = require('semver-sort');
import { SidebarHeader } from 'ts/components/documentation/sidebar_header';
import { NestedSidebarMenu } from 'ts/components/nested_sidebar_menu';
import { Container } from 'ts/components/ui/container';
import { DevelopersPage } from 'ts/pages/documentation/developers_page';
import { Dispatcher } from 'ts/redux/dispatcher';
import { DocPackages, ScreenWidths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { docUtils } from 'ts/utils/doc_utils';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

const isDevelopmentOrStaging = utils.isDevelopment() || utils.isStaging();
const ZERO_EX_JS_VERSION_MISSING_TOPLEVEL_PATH = '0.32.4';

const docIdToSubpackageName: { [id: string]: string } = {
    [DocPackages.ZeroExJs]: '0x.js',
    [DocPackages.Connect]: 'connect',
    [DocPackages.SmartContracts]: 'contracts',
    [DocPackages.Web3Wrapper]: 'web3-wrapper',
    [DocPackages.ContractWrappers]: 'contract-wrappers',
    [DocPackages.SolCompiler]: 'sol-compiler',
    [DocPackages.JSONSchemas]: 'json-schemas',
    [DocPackages.SolCov]: 'sol-cov',
    [DocPackages.Subproviders]: 'subproviders',
    [DocPackages.OrderUtils]: 'order-utils',
    [DocPackages.OrderWatcher]: 'order-watcher',
    [DocPackages.EthereumTypes]: 'ethereum-types',
    [DocPackages.AssetBuyer]: 'asset-buyer',
};

export interface DocPageProps {
    location: Location;
    dispatcher: Dispatcher;
    docsVersion: string;
    availableDocVersions: string[];
    docsInfo: DocsInfo;
    translate: Translate;
    screenWidth: ScreenWidths;
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
        const sourceUrl = this._getSourceUrl();
        const sectionNameToLinks = _.isUndefined(this.state.docAgnosticFormat)
            ? {}
            : this.props.docsInfo.getSectionNameToLinks(this.state.docAgnosticFormat);
        const mainContent = _.isUndefined(this.state.docAgnosticFormat) ? (
            <div className="flex justify-center">{this._renderLoading()}</div>
        ) : (
            <DocReference
                selectedVersion={this.props.docsVersion}
                availableVersions={this.props.availableDocVersions}
                docsInfo={this.props.docsInfo}
                docAgnosticFormat={this.state.docAgnosticFormat}
                sourceUrl={sourceUrl}
            />
        );
        const sidebar = _.isUndefined(this.state.docAgnosticFormat) ? (
            <div />
        ) : (
            <NestedSidebarMenu sidebarHeader={this._renderSidebarHeader()} sectionNameToLinks={sectionNameToLinks} />
        );
        return (
            <DevelopersPage
                sidebar={sidebar}
                mainContent={mainContent}
                location={this.props.location}
                screenWidth={this.props.screenWidth}
                translate={this.props.translate}
                dispatcher={this.props.dispatcher}
            />
        );
    }
    private _renderSidebarHeader(): React.ReactNode {
        return (
            <SidebarHeader
                screenWidth={this.props.screenWidth}
                title={this.props.docsInfo.displayName}
                docsVersion={this.props.docsVersion}
                availableDocVersions={this.props.availableDocVersions}
                onVersionSelected={this._onVersionSelected.bind(this)}
            />
        );
    }
    private _renderLoading(): React.ReactNode {
        return (
            <Container className="pt4">
                <Container className="center pb2">
                    <CircularProgress size={40} thickness={5} />
                </Container>
                <Container className="center pt2" paddingBottom="11px">
                    Loading documentation...
                </Container>
            </Container>
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
        let docAgnosticFormat;
        if (this.props.docsInfo.type === SupportedDocJson.TypeDoc) {
            docAgnosticFormat = new TypeDocUtils(
                versionDocObj as GeneratedDocJson,
                this.props.docsInfo,
            ).convertToDocAgnosticFormat();
        } else if (this.props.docsInfo.type === SupportedDocJson.SolDoc) {
            // documenting solidity.
            docAgnosticFormat = versionDocObj as DocAgnosticFormat;
            // HACK: need to modify docsInfo like convertToDocAgnosticFormat() would do
            this.props.docsInfo.markdownMenu.Contracts = [];
            _.each(docAgnosticFormat, (_docObj, sectionName) => {
                this.props.docsInfo.sections[sectionName] = sectionName;
                this.props.docsInfo.markdownMenu.Contracts.push(sectionName);
            });
        }

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
            tagPrefix = `@0x/${pkg}`;
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
