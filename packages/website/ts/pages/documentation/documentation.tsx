import findVersions = require('find-versions');
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import {
    scroller,
} from 'react-scroll';
import semverSort = require('semver-sort');
import {TopBar} from 'ts/components/top_bar';
import {Badge} from 'ts/components/ui/badge';
import {Comment} from 'ts/pages/documentation/comment';
import {DocsInfo} from 'ts/pages/documentation/docs_info';
import {EventDefinition} from 'ts/pages/documentation/event_definition';
import {MethodBlock} from 'ts/pages/documentation/method_block';
import {SourceLink} from 'ts/pages/documentation/source_link';
import {Type} from 'ts/pages/documentation/type';
import {TypeDefinition} from 'ts/pages/documentation/type_definition';
import {MarkdownSection} from 'ts/pages/shared/markdown_section';
import {NestedSidebarMenu} from 'ts/pages/shared/nested_sidebar_menu';
import {SectionHeader} from 'ts/pages/shared/section_header';
import {Dispatcher} from 'ts/redux/dispatcher';
import {
    AddressByContractName,
    DocAgnosticFormat,
    DoxityDocObj,
    EtherscanLinkSuffixes,
    Event,
    Networks,
    Property,
    SolidityMethod,
    Styles,
    TypeDefinitionByName,
    TypescriptMethod,
} from 'ts/types';
import {colors} from 'ts/utils/colors';
import {configs} from 'ts/utils/configs';
import {constants} from 'ts/utils/constants';
import {docUtils} from 'ts/utils/doc_utils';
import {utils} from 'ts/utils/utils';

const SCROLL_TOP_ID = 'docsScrollTop';

const networkNameToColor: {[network: string]: string} = {
    [Networks.kovan]: colors.purple,
    [Networks.ropsten]: colors.red,
    [Networks.mainnet]: colors.turquois,
};

export interface DocumentationAllProps {
    source: string;
    location: Location;
    dispatcher: Dispatcher;
    docsVersion: string;
    availableDocVersions: string[];
    docsInfo: DocsInfo;
}

interface DocumentationState {
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

export class Documentation extends
    React.Component<DocumentationAllProps, DocumentationState> {
    constructor(props: DocumentationAllProps) {
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
        this._fetchJSONDocsFireAndForgetAsync(preferredVersionIfExists);
    }
    public render() {
        const menuSubsectionsBySection = _.isUndefined(this.state.docAgnosticFormat) ?
                {} :
                this.props.docsInfo.getMenuSubsectionsBySection(this.state.docAgnosticFormat);
        return (
            <div>
                <DocumentTitle title={`${this.props.docsInfo.displayName} Documentation`}/>
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    docsVersion={this.props.docsVersion}
                    availableDocVersions={this.props.availableDocVersions}
                    menu={this.props.docsInfo.getMenu(this.props.docsVersion)}
                    menuSubsectionsBySection={menuSubsectionsBySection}
                    shouldFullWidth={true}
                    docsInfo={this.props.docsInfo}
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
                                    topLevelMenu={this.props.docsInfo.getMenu(this.props.docsVersion)}
                                    menuSubsectionsBySection={menuSubsectionsBySection}
                                    docPath={this.props.docsInfo.websitePath}
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
                                    <a href={this.props.docsInfo.packageUrl} target="_blank">
                                        {this.props.docsInfo.displayName}
                                    </a>
                                </h1>
                                {this._renderDocumentation()}
                            </div>
                        </div>
                    </div>
                }
            </div>
        );
    }
    private _renderDocumentation(): React.ReactNode {
        const subMenus = _.values(this.props.docsInfo.getMenu());
        const orderedSectionNames = _.flatten(subMenus);

        const typeDefinitionByName = this.props.docsInfo.getTypeDefinitionsByName(this.state.docAgnosticFormat);
        const renderedSections = _.map(orderedSectionNames, this._renderSection.bind(this, typeDefinitionByName));

        return renderedSections;
    }
    private _renderSection(typeDefinitionByName: TypeDefinitionByName, sectionName: string): React.ReactNode {
        const markdownFileIfExists = this.props.docsInfo.sectionNameToMarkdown[sectionName];
        if (!_.isUndefined(markdownFileIfExists)) {
            return (
                <MarkdownSection
                    key={`markdown-section-${sectionName}`}
                    sectionName={sectionName}
                    markdownContent={markdownFileIfExists}
                />
            );
        }

        const docSection = this.state.docAgnosticFormat[sectionName];
        if (_.isUndefined(docSection)) {
            return null;
        }

        const sortedTypes = _.sortBy(docSection.types, 'name');
        const typeDefs = _.map(sortedTypes, customType => {
            return (
                <TypeDefinition
                    key={`type-${customType.name}`}
                    customType={customType}
                    docsInfo={this.props.docsInfo}
                />
            );
        });

        const sortedProperties = _.sortBy(docSection.properties, 'name');
        const propertyDefs = _.map(sortedProperties, this._renderProperty.bind(this));

        const sortedMethods = _.sortBy(docSection.methods, 'name');
        const methodDefs = _.map(sortedMethods, method => {
            const isConstructor = false;
            return this._renderMethodBlocks(method, sectionName, isConstructor, typeDefinitionByName);
        });

        const sortedEvents = _.sortBy(docSection.events, 'name');
        const eventDefs = _.map(sortedEvents, (event: Event, i: number) => {
            return (
                <EventDefinition
                    key={`event-${event.name}-${i}`}
                    event={event}
                    docsInfo={this.props.docsInfo}
                />
            );
        });
        return (
            <div
                key={`section-${sectionName}`}
                className="py2 pr3 md-pl2 sm-pl3"
            >
                <div className="flex">
                        <div style={{marginRight: 7}}>
                            <SectionHeader sectionName={sectionName} />
                        </div>
                        {this._renderNetworkBadgesIfExists(sectionName)}
                </div>
                {docSection.comment &&
                    <Comment
                        comment={docSection.comment}
                    />
                }
                {docSection.constructors.length > 0 &&
                 this.props.docsInfo.isVisibleConstructor(sectionName) &&
                    <div>
                        <h2 className="thin">Constructor</h2>
                        {this._renderConstructors(docSection.constructors, sectionName, typeDefinitionByName)}
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
                {!_.isUndefined(docSection.events) && docSection.events.length > 0 &&
                    <div>
                        <h2 className="thin">Events</h2>
                        <div>{eventDefs}</div>
                    </div>
                }
                {!_.isUndefined(typeDefs) &&  typeDefs.length > 0 &&
                    <div>
                        <div>{typeDefs}</div>
                    </div>
                }
            </div>
        );
    }
    private _renderNetworkBadgesIfExists(sectionName: string) {
        const networkToAddressByContractName = configs.CONTRACT_ADDRESS[this.props.docsVersion];
        const badges = _.map(networkToAddressByContractName,
            (addressByContractName: AddressByContractName, networkName: string) => {
                const contractAddress = addressByContractName[sectionName];
                if (_.isUndefined(contractAddress)) {
                    return null;
                }
                const linkIfExists = utils.getEtherScanLinkIfExists(
                    contractAddress, constants.NETWORK_ID_BY_NAME[networkName], EtherscanLinkSuffixes.Address,
                );
                return (
                    <a
                        key={`badge-${networkName}-${sectionName}`}
                        href={linkIfExists}
                        target="_blank"
                        style={{color: colors.white, textDecoration: 'none'}}
                    >
                        <Badge
                            title={networkName}
                            backgroundColor={networkNameToColor[networkName]}
                        />
                    </a>
                );
        });
        return badges;
    }
    private _renderConstructors(constructors: SolidityMethod[]|TypescriptMethod[],
                                sectionName: string,
                                typeDefinitionByName: TypeDefinitionByName): React.ReactNode {
        const constructorDefs = _.map(constructors, constructor => {
            return this._renderMethodBlocks(
                constructor, sectionName, constructor.isConstructor, typeDefinitionByName,
            );
        });
        return (
            <div>
                {constructorDefs}
            </div>
        );
    }
    private _renderProperty(property: Property): React.ReactNode {
        return (
            <div
                key={`property-${property.name}-${property.type.name}`}
                className="pb3"
            >
                <code className="hljs">
                    {property.name}: <Type type={property.type} docsInfo={this.props.docsInfo} />
                </code>
                {property.source &&
                    <SourceLink
                        version={this.props.docsVersion}
                        source={property.source}
                        baseUrl={this.props.docsInfo.packageUrl}
                        subPackageName={this.props.docsInfo.subPackageName}
                    />
                }
                {property.comment &&
                    <Comment
                        comment={property.comment}
                        className="py2"
                    />
                }
            </div>
        );
    }
    private _renderMethodBlocks(method: SolidityMethod|TypescriptMethod, sectionName: string,
                                isConstructor: boolean, typeDefinitionByName: TypeDefinitionByName): React.ReactNode {
        return (
            <MethodBlock
               key={`method-${method.name}-${sectionName}`}
               method={method}
               typeDefinitionByName={typeDefinitionByName}
               libraryVersion={this.props.docsVersion}
               docsInfo={this.props.docsInfo}
            />
        );
    }
    private _scrollToHash(): void {
        const hashWithPrefix = this.props.location.hash;
        let hash = hashWithPrefix.slice(1);
        if (_.isEmpty(hash)) {
            hash = SCROLL_TOP_ID; // scroll to the top
        }

        scroller.scrollTo(hash, {duration: 0, offset: 0, containerId: 'documentation'});
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
            versionFileNameToFetch, this.props.docsInfo.docsJsonRoot,
        );
        const docAgnosticFormat = this.props.docsInfo.convertToDocAgnosticFormat(versionDocObj as DoxityDocObj);

        this.setState({
            docAgnosticFormat,
        }, () => {
            this._scrollToHash();
        });
    }
}
