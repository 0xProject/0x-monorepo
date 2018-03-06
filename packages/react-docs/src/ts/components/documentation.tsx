import {
    colors,
    constants as sharedConstants,
    EtherscanLinkSuffixes,
    MarkdownSection,
    MenuSubsectionsBySection,
    NestedSidebarMenu,
    Networks,
    SectionHeader,
    Styles,
    utils as sharedUtils,
} from '@0xproject/react-shared';
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import * as React from 'react';
import { scroller } from 'react-scroll';

import {
    AddressByContractName,
    DocAgnosticFormat,
    DoxityDocObj,
    Event,
    Property,
    SolidityMethod,
    SupportedDocJson,
    TypeDefinitionByName,
    TypescriptMethod,
} from '../types';
import { utils } from '../utils/utils';

import { Badge } from './badge';
import { Comment } from './comment';
import { DocsInfo } from './docs_info';
import { EventDefinition } from './event_definition';
import { MethodBlock } from './method_block';
import { SourceLink } from './source_link';
import { Type } from './type';
import { TypeDefinition } from './type_definition';

const TOP_BAR_HEIGHT = 60;

const networkNameToColor: { [network: string]: string } = {
    [Networks.Kovan]: colors.purple,
    [Networks.Ropsten]: colors.red,
    [Networks.Mainnet]: colors.turquois,
    [Networks.Rinkeby]: colors.darkYellow,
};

export interface DocumentationProps {
    docsVersion: string;
    availableDocVersions: string[];
    docsInfo: DocsInfo;
    docAgnosticFormat?: DocAgnosticFormat;
    menuSubsectionsBySection: MenuSubsectionsBySection;
    sourceUrl: string;
}

export interface DocumentationState {}

const styles: Styles = {
    mainContainers: {
        position: 'absolute',
        top: 1,
        left: 0,
        bottom: 0,
        right: 0,
        overflowZ: 'hidden',
        overflowY: 'scroll',
        minHeight: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
        WebkitOverflowScrolling: 'touch',
    },
    menuContainer: {
        borderColor: colors.grey300,
        maxWidth: 330,
        marginLeft: 20,
    },
};

export class Documentation extends React.Component<DocumentationProps, DocumentationState> {
    public componentDidUpdate(prevProps: DocumentationProps, prevState: DocumentationState) {
        if (!_.isEqual(prevProps.docAgnosticFormat, this.props.docAgnosticFormat)) {
            const hash = window.location.hash.slice(1);
            sharedUtils.scrollToHash(hash, sharedConstants.SCROLL_CONTAINER_ID);
        }
    }
    public render() {
        return (
            <div>
                {_.isUndefined(this.props.docAgnosticFormat) ? (
                    this._renderLoading()
                ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: colors.gray40 }}>
                        <div
                            className="mx-auto max-width-4 flex"
                            style={{ color: colors.grey800, height: `calc(100vh - ${TOP_BAR_HEIGHT}px)` }}
                        >
                            <div
                                className="relative sm-hide xs-hide"
                                style={{ width: '36%', height: `calc(100vh - ${TOP_BAR_HEIGHT}px)` }}
                            >
                                <div
                                    className="border-right absolute"
                                    style={{
                                        ...styles.menuContainer,
                                        ...styles.mainContainers,
                                        height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
                                    }}
                                >
                                    <NestedSidebarMenu
                                        selectedVersion={this.props.docsVersion}
                                        versions={this.props.availableDocVersions}
                                        title={this.props.docsInfo.displayName}
                                        topLevelMenu={this.props.docsInfo.getMenu(this.props.docsVersion)}
                                        menuSubsectionsBySection={this.props.menuSubsectionsBySection}
                                    />
                                </div>
                            </div>
                            <div
                                className="relative col lg-col-9 md-col-9 sm-col-12 col-12"
                                style={{ backgroundColor: colors.white }}
                            >
                                <div
                                    id={sharedConstants.SCROLL_CONTAINER_ID}
                                    style={styles.mainContainers}
                                    className="absolute px1"
                                >
                                    <div id={sharedConstants.SCROLL_TOP_ID} />
                                    {this._renderDocumentation()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    private _renderLoading() {
        return (
            <div className="col col-12" style={styles.mainContainers}>
                <div
                    className="relative sm-px2 sm-pt2 sm-m1"
                    style={{ height: 122, top: '50%', transform: 'translateY(-50%)' }}
                >
                    <div className="center pb2">
                        <CircularProgress size={40} thickness={5} />
                    </div>
                    <div className="center pt2" style={{ paddingBottom: 11 }}>
                        Loading documentation...
                    </div>
                </div>
            </div>
        );
    }
    private _renderDocumentation(): React.ReactNode {
        const subMenus = _.values(this.props.docsInfo.getMenu());
        const orderedSectionNames = _.flatten(subMenus);

        const typeDefinitionByName = this.props.docsInfo.getTypeDefinitionsByName(this.props.docAgnosticFormat);
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

        const docSection = this.props.docAgnosticFormat[sectionName];
        if (_.isUndefined(docSection)) {
            return null;
        }

        const sortedTypes = _.sortBy(docSection.types, 'name');
        const typeDefs = _.map(sortedTypes, customType => {
            return (
                <TypeDefinition
                    sectionName={sectionName}
                    key={`type-${customType.name}`}
                    customType={customType}
                    docsInfo={this.props.docsInfo}
                />
            );
        });

        const sortedProperties = _.sortBy(docSection.properties, 'name');
        const propertyDefs = _.map(sortedProperties, this._renderProperty.bind(this, sectionName));

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
                    sectionName={sectionName}
                    docsInfo={this.props.docsInfo}
                />
            );
        });
        return (
            <div key={`section-${sectionName}`} className="py2 pr3 md-pl2 sm-pl3">
                <div className="flex pb2">
                    <div style={{ marginRight: 7 }}>
                        <SectionHeader sectionName={sectionName} />
                    </div>
                    {this._renderNetworkBadgesIfExists(sectionName)}
                </div>
                {docSection.comment && <Comment comment={docSection.comment} />}
                {docSection.constructors.length > 0 &&
                    this.props.docsInfo.isVisibleConstructor(sectionName) && (
                        <div>
                            <h2 className="thin">Constructor</h2>
                            {this._renderConstructors(docSection.constructors, sectionName, typeDefinitionByName)}
                        </div>
                    )}
                {docSection.properties.length > 0 && (
                    <div>
                        <h2 className="thin">Properties</h2>
                        <div>{propertyDefs}</div>
                    </div>
                )}
                {docSection.methods.length > 0 && (
                    <div>
                        <h2 className="thin">Methods</h2>
                        <div>{methodDefs}</div>
                    </div>
                )}
                {!_.isUndefined(docSection.events) &&
                    docSection.events.length > 0 && (
                        <div>
                            <h2 className="thin">Events</h2>
                            <div>{eventDefs}</div>
                        </div>
                    )}
                {!_.isUndefined(typeDefs) &&
                    typeDefs.length > 0 && (
                        <div>
                            <div>{typeDefs}</div>
                        </div>
                    )}
            </div>
        );
    }
    private _renderNetworkBadgesIfExists(sectionName: string) {
        if (this.props.docsInfo.type !== SupportedDocJson.Doxity) {
            return null;
        }

        const networkToAddressByContractName = this.props.docsInfo.contractsByVersionByNetworkId[
            this.props.docsVersion
        ];
        const badges = _.map(
            networkToAddressByContractName,
            (addressByContractName: AddressByContractName, networkName: string) => {
                const contractAddress = addressByContractName[sectionName];
                if (_.isUndefined(contractAddress)) {
                    return null;
                }
                const linkIfExists = sharedUtils.getEtherScanLinkIfExists(
                    contractAddress,
                    sharedConstants.NETWORK_ID_BY_NAME[networkName],
                    EtherscanLinkSuffixes.Address,
                );
                return (
                    <a
                        key={`badge-${networkName}-${sectionName}`}
                        href={linkIfExists}
                        target="_blank"
                        style={{ color: colors.white, textDecoration: 'none' }}
                    >
                        <Badge title={networkName} backgroundColor={networkNameToColor[networkName]} />
                    </a>
                );
            },
        );
        return badges;
    }
    private _renderConstructors(
        constructors: SolidityMethod[] | TypescriptMethod[],
        sectionName: string,
        typeDefinitionByName: TypeDefinitionByName,
    ): React.ReactNode {
        const constructorDefs = _.map(constructors, constructor => {
            return this._renderMethodBlocks(constructor, sectionName, constructor.isConstructor, typeDefinitionByName);
        });
        return <div>{constructorDefs}</div>;
    }
    private _renderProperty(sectionName: string, property: Property): React.ReactNode {
        return (
            <div key={`property-${property.name}-${property.type.name}`} className="pb3">
                <code className="hljs">
                    {property.name}:
                    <Type type={property.type} sectionName={sectionName} docsInfo={this.props.docsInfo} />
                </code>
                {property.source && (
                    <SourceLink
                        version={this.props.docsVersion}
                        source={property.source}
                        sourceUrl={this.props.sourceUrl}
                    />
                )}
                {property.comment && <Comment comment={property.comment} className="py2" />}
            </div>
        );
    }
    private _renderMethodBlocks(
        method: SolidityMethod | TypescriptMethod,
        sectionName: string,
        isConstructor: boolean,
        typeDefinitionByName: TypeDefinitionByName,
    ): React.ReactNode {
        return (
            <MethodBlock
                key={`method-${method.name}-${sectionName}`}
                sectionName={sectionName}
                method={method}
                typeDefinitionByName={typeDefinitionByName}
                libraryVersion={this.props.docsVersion}
                docsInfo={this.props.docsInfo}
                sourceUrl={this.props.sourceUrl}
            />
        );
    }
}
