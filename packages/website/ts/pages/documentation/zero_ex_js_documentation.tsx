import findVersions = require('find-versions');
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import {colors} from 'material-ui/styles';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import * as ReactMarkdown from 'react-markdown';
import {
    Element as ScrollElement,
    Link as ScrollLink,
    scroller,
} from 'react-scroll';
import semverSort = require('semver-sort');
import {TopBar} from 'ts/components/top_bar';
import {Loading} from 'ts/components/ui/loading';
import {Comment} from 'ts/pages/documentation/comment';
import {DocsInfo} from 'ts/pages/documentation/docs_info';
import {MethodBlock} from 'ts/pages/documentation/method_block';
import {SourceLink} from 'ts/pages/documentation/source_link';
import {Type} from 'ts/pages/documentation/type';
import {TypeDefinition} from 'ts/pages/documentation/type_definition';
import {AnchorTitle} from 'ts/pages/shared/anchor_title';
import {MarkdownSection} from 'ts/pages/shared/markdown_section';
import {NestedSidebarMenu} from 'ts/pages/shared/nested_sidebar_menu';
import {SectionHeader} from 'ts/pages/shared/section_header';
import {Dispatcher} from 'ts/redux/dispatcher';
import {
    CustomType,
    DocAgnosticFormat,
    Docs,
    DocsInfoConfig,
    KindString,
    Property,
    ScreenWidths,
    Styles,
    TypeDefinitionByName,
    TypeDocNode,
    TypescriptMethod,
    WebsitePaths,
} from 'ts/types';
import {constants} from 'ts/utils/constants';
import {docUtils} from 'ts/utils/doc_utils';
import {typeDocUtils} from 'ts/utils/typedoc_utils';
import {utils} from 'ts/utils/utils';
/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/0xjs/introduction');
const InstallationMarkdown = require('md/docs/0xjs/installation');
const AsyncMarkdown = require('md/docs/0xjs/async');
const ErrorsMarkdown = require('md/docs/0xjs/errors');
const versioningMarkdown = require('md/docs/0xjs/versioning');
/* tslint:enable:no-var-requires */

const SCROLL_TO_TIMEOUT = 500;
const SCROLL_TOP_ID = 'docsScrollTop';

const zeroExJsDocSections = {
    introduction: 'introduction',
    installation: 'installation',
    testrpc: 'testrpc',
    async: 'async',
    errors: 'errors',
    versioning: 'versioning',
    zeroEx: 'zeroEx',
    exchange: 'exchange',
    token: 'token',
    tokenRegistry: 'tokenRegistry',
    etherToken: 'etherToken',
    proxy: 'proxy',
    types: 'types',
};

const docsInfoConfig: DocsInfoConfig = {
    packageName: '0x.js',
    packageUrl: 'https://github.com/0xProject/0x.js',
    websitePath: WebsitePaths.ZeroExJs,
    docsJsonRoot: 'https://s3.amazonaws.com/0xjs-docs-jsons',
    menu: {
        introduction: [
            zeroExJsDocSections.introduction,
        ],
        install: [
            zeroExJsDocSections.installation,
        ],
        topics: [
            zeroExJsDocSections.async,
            zeroExJsDocSections.errors,
            zeroExJsDocSections.versioning,
        ],
        zeroEx: [
            zeroExJsDocSections.zeroEx,
        ],
        contracts: [
            zeroExJsDocSections.exchange,
            zeroExJsDocSections.token,
            zeroExJsDocSections.tokenRegistry,
            zeroExJsDocSections.etherToken,
            zeroExJsDocSections.proxy,
        ],
        types: [
            zeroExJsDocSections.types,
        ],
    },
    sectionNameToMarkdown: {
        [zeroExJsDocSections.introduction]: IntroMarkdown,
        [zeroExJsDocSections.installation]: InstallationMarkdown,
        [zeroExJsDocSections.async]: AsyncMarkdown,
        [zeroExJsDocSections.errors]: ErrorsMarkdown,
        [zeroExJsDocSections.versioning]: versioningMarkdown,
    },
    // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
    // currently no way to extract the re-exported types from index.ts via TypeDoc :(
    publicTypes: [
        'Order',
        'SignedOrder',
        'ECSignature',
        'ZeroExError',
        'EventCallback',
        'EventCallbackAsync',
        'EventCallbackSync',
        'ExchangeContractErrs',
        'ContractEvent',
        'Token',
        'ExchangeEvents',
        'IndexedFilterValues',
        'SubscriptionOpts',
        'BlockParam',
        'OrderFillOrKillRequest',
        'OrderCancellationRequest',
        'OrderFillRequest',
        'ContractEventEmitter',
        'Web3Provider',
        'ContractEventArgs',
        'LogCancelArgs',
        'LogFillArgs',
        'LogErrorContractEventArgs',
        'LogFillContractEventArgs',
        'LogCancelContractEventArgs',
        'TokenEvents',
        'ExchangeContractEventArgs',
        'TransferContractEventArgs',
        'ApprovalContractEventArgs',
        'TokenContractEventArgs',
        'ZeroExConfig',
        'TransactionReceiptWithDecodedLogs',
        'LogWithDecodedArgs',
        'DecodedLogArgs',
        'MethodOpts',
        'ValidateOrderFillableOpts',
        'OrderTransactionOpts',
        'ContractEventArg',
        'LogEvent',
        'LogEntry',
        'DecodedLogEvent',
    ],
    sectionNameToModulePath: {
        [zeroExJsDocSections.zeroEx]: ['"src/0x"'],
        [zeroExJsDocSections.exchange]: ['"src/contract_wrappers/exchange_wrapper"'],
        [zeroExJsDocSections.tokenRegistry]: ['"src/contract_wrappers/token_registry_wrapper"'],
        [zeroExJsDocSections.token]: ['"src/contract_wrappers/token_wrapper"'],
        [zeroExJsDocSections.etherToken]: ['"src/contract_wrappers/ether_token_wrapper"'],
        [zeroExJsDocSections.proxy]: [
            '"src/contract_wrappers/proxy_wrapper"',
            '"src/contract_wrappers/token_transfer_proxy_wrapper"',
        ],
        [zeroExJsDocSections.types]: ['"src/types"'],
    },
    menuSubsectionToVersionWhenIntroduced: {
        [zeroExJsDocSections.etherToken]: '0.7.1',
        [zeroExJsDocSections.proxy]: '0.8.0',
    },
    sections: zeroExJsDocSections,
};
const docsInfo = new DocsInfo(docsInfoConfig);

export interface ZeroExJSDocumentationPassedProps {
    source: string;
    location: Location;
}

export interface ZeroExJSDocumentationAllProps {
    source: string;
    location: Location;
    dispatcher: Dispatcher;
    docsVersion: string;
    availableDocVersions: string[];
}

interface ZeroExJSDocumentationState {
    docAgnosticFormat?: DocAgnosticFormat;
}

const styles: Styles = {
    mainContainers: {
        position: 'absolute',
        top: 60,
        left: 0,
        bottom: 0,
        right: 0,
        overflowZ: 'hidden',
        overflowY: 'scroll',
        minHeight: 'calc(100vh - 60px)',
        WebkitOverflowScrolling: 'touch',
    },
    menuContainer: {
        borderColor: colors.grey300,
        maxWidth: 330,
        marginLeft: 20,
    },
};

export class ZeroExJSDocumentation extends React.Component<ZeroExJSDocumentationAllProps, ZeroExJSDocumentationState> {
    constructor(props: ZeroExJSDocumentationAllProps) {
        super(props);
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
        this.fetchJSONDocsFireAndForgetAsync(preferredVersionIfExists);
    }
    public render() {
        const menuSubsectionsBySection = _.isUndefined(this.state.docAgnosticFormat) ?
                {} :
                typeDocUtils.getMenuSubsectionsBySection(docsInfo.sections, this.state.docAgnosticFormat);
        return (
            <div>
                <DocumentTitle title={`${docsInfo.packageName} Documentation`}/>
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    docsVersion={this.props.docsVersion}
                    availableDocVersions={this.props.availableDocVersions}
                    menu={docsInfo.getMenu(this.props.docsVersion)}
                    menuSubsectionsBySection={menuSubsectionsBySection}
                    shouldFullWidth={true}
                    docPath={docsInfo.websitePath}
                />
                {_.isUndefined(this.state.docAgnosticFormat) ?
                    <div
                        className="col col-12"
                        style={styles.mainContainers}
                    >
                        <div
                            className="relative sm-px2 sm-pt2 sm-m1"
                            style={{height: 122, top: '50%', transform: 'translateY(-50%)'}}
                        >
                            <div className="center pb2">
                                <CircularProgress size={40} thickness={5} />
                            </div>
                            <div className="center pt2" style={{paddingBottom: 11}}>Loading documentation...</div>
                        </div>
                    </div> :
                    <div
                        className="mx-auto flex"
                        style={{color: colors.grey800, height: 43}}
                    >
                        <div className="relative col md-col-3 lg-col-3 lg-pl0 md-pl1 sm-hide xs-hide">
                            <div
                                className="border-right absolute"
                                style={{...styles.menuContainer, ...styles.mainContainers}}
                            >
                                <NestedSidebarMenu
                                    selectedVersion={this.props.docsVersion}
                                    versions={this.props.availableDocVersions}
                                    topLevelMenu={docsInfo.getMenu(this.props.docsVersion)}
                                    menuSubsectionsBySection={menuSubsectionsBySection}
                                    docPath={docsInfo.websitePath}
                                />
                            </div>
                        </div>
                        <div className="relative col lg-col-9 md-col-9 sm-col-12 col-12">
                            <div
                                id="documentation"
                                style={styles.mainContainers}
                                className="absolute"
                            >
                                <div id={SCROLL_TOP_ID} />
                                <h1 className="md-pl2 sm-pl3">
                                    <a href={docsInfo.packageUrl} target="_blank">
                                        {docsInfo.packageName}
                                    </a>
                                </h1>
                                {this.renderDocumentation()}
                            </div>
                        </div>
                    </div>
                }
            </div>
        );
    }
    private renderDocumentation(): React.ReactNode {
        const typeDocSection = this.state.docAgnosticFormat[docsInfo.sections.types];
        const typeDefinitionByName = _.keyBy(typeDocSection.types, 'name');

        const subMenus = _.values(docsInfo.getMenu());
        const orderedSectionNames = _.flatten(subMenus);
        const sections = _.map(orderedSectionNames, this.renderSection.bind(this, typeDefinitionByName));

        return sections;
    }
    private renderSection(typeDefinitionByName: TypeDefinitionByName, sectionName: string): React.ReactNode {
        const docSection = this.state.docAgnosticFormat[sectionName];

        const markdownFileIfExists = docsInfo.sectionNameToMarkdown[sectionName];
        if (!_.isUndefined(markdownFileIfExists)) {
            return (
                <MarkdownSection
                    key={`markdown-section-${sectionName}`}
                    sectionName={sectionName}
                    markdownContent={markdownFileIfExists}
                />
            );
        }

        if (_.isUndefined(docSection)) {
            return null;
        }

        const typeDefs = _.map(docSection.types, customType => {
            return (
                <TypeDefinition
                    key={`type-${customType.name}`}
                    customType={customType}
                    docsInfo={docsInfo}
                />
            );
        });
        const propertyDefs = _.map(docSection.properties, this.renderProperty.bind(this));
        const methodDefs = _.map(docSection.methods, method => {
            const isConstructor = false;
            return this.renderMethodBlocks(method, sectionName, isConstructor, typeDefinitionByName);
        });
        return (
            <div
                key={`section-${sectionName}`}
                className="py2 pr3 md-pl2 sm-pl3"
            >
                <SectionHeader sectionName={sectionName} />
                <Comment
                    comment={docSection.comment}
                />
                {sectionName === docsInfo.sections.zeroEx && docSection.constructors.length > 0 &&
                    <div>
                        <h2 className="thin">Constructor</h2>
                        {this.renderZeroExConstructors(docSection.constructors, typeDefinitionByName)}
                    </div>
                }
                {docSection.properties.length > 0 &&
                    <div>
                        <h2 className="thin">Properties</h2>
                        <div>{propertyDefs}</div>
                    </div>
                }
                {docSection.methods.length > 0 &&
                    <div>
                        <h2 className="thin">Methods</h2>
                        <div>{methodDefs}</div>
                    </div>
                }
                {typeDefs.length > 0 &&
                    <div>
                        <div>{typeDefs}</div>
                    </div>
                }
            </div>
        );
    }
    private renderZeroExConstructors(constructors: TypescriptMethod[],
                                     typeDefinitionByName: TypeDefinitionByName): React.ReactNode {
        const constructorDefs = _.map(constructors, constructor => {
            return this.renderMethodBlocks(
                constructor, docsInfo.sections.zeroEx, constructor.isConstructor, typeDefinitionByName,
            );
        });
        return (
            <div>
                {constructorDefs}
            </div>
        );
    }
    private renderProperty(property: Property): React.ReactNode {
        return (
            <div
                key={`property-${property.name}-${property.type.name}`}
                className="pb3"
            >
                <code className="hljs">
                    {property.name}: <Type type={property.type} docsInfo={docsInfo} />
                </code>
                <SourceLink
                    version={this.props.docsVersion}
                    source={property.source}
                    baseUrl={docsInfo.packageUrl}
                />
                {property.comment &&
                    <Comment
                        comment={property.comment}
                        className="py2"
                    />
                }
            </div>
        );
    }
    private renderMethodBlocks(method: TypescriptMethod, sectionName: string, isConstructor: boolean,
                               typeDefinitionByName: TypeDefinitionByName): React.ReactNode {
        return (
            <MethodBlock
               key={`method-${method.name}-${!_.isUndefined(method.source) ? method.source.line : ''}`}
               method={method}
               typeDefinitionByName={typeDefinitionByName}
               libraryVersion={this.props.docsVersion}
               docsInfo={docsInfo}
            />
        );
    }
    private scrollToHash(): void {
        const hashWithPrefix = this.props.location.hash;
        let hash = hashWithPrefix.slice(1);
        if (_.isEmpty(hash)) {
            hash = SCROLL_TOP_ID; // scroll to the top
        }

        scroller.scrollTo(hash, {duration: 0, offset: 0, containerId: 'documentation'});
    }
    private async fetchJSONDocsFireAndForgetAsync(preferredVersionIfExists?: string): Promise<void> {
        const versionToFileName = await docUtils.getVersionToFileNameAsync(docsInfo.docsJsonRoot);
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
            versionFileNameToFetch, docsInfo.docsJsonRoot,
        );
        const docAgnosticFormat = typeDocUtils.convertToDocAgnosticFormat(
            docsInfo, (versionDocObj as TypeDocNode),
        );

        this.setState({
            docAgnosticFormat,
        }, () => {
            this.scrollToHash();
        });
    }
}
