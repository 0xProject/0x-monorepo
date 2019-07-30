import {
    DocAgnosticFormat,
    Event,
    ExternalExportToLink,
    Property,
    SolidityMethod,
    TypeDefinitionByName,
    TypescriptFunction,
    TypescriptMethod,
} from '@0x/types';
import * as _ from 'lodash';
import * as React from 'react';
import * as semver from 'semver';
import { Link } from 'ts/components/documentation/shared/link';
import { MarkdownSection } from 'ts/components/documentation/shared/markdown_section';
import { SectionHeader } from 'ts/components/documentation/shared/section_header';
import { AddressByContractName, EtherscanLinkSuffixes, HeaderSizes, Networks, SupportedDocJson } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

import { DocsInfo } from 'ts/utils/docs_info';

import { Badge } from './badge';
import { Comment } from './comment';
import { EventDefinition } from './event_definition';
import { PropertyBlock } from './property_block';
import { SignatureBlock } from './signature_block';
import { TypeDefinition } from './type_definition';

const networkNameToColor: { [network: string]: string } = {
    [Networks.Kovan]: colors.purple,
    [Networks.Ropsten]: colors.red,
    [Networks.Mainnet]: colors.turquois,
    [Networks.Rinkeby]: colors.darkYellow,
};

export interface DocReferenceProps {
    selectedVersion: string;
    availableVersions: string[];
    docsInfo: DocsInfo;
    sourceUrl: string;
    docAgnosticFormat?: DocAgnosticFormat;
}

export interface DocReferenceState {}

export class DocReference extends React.Component<DocReferenceProps, DocReferenceState> {
    public componentDidUpdate(prevProps: DocReferenceProps, _prevState: DocReferenceState): void {
        if (!_.isEqual(prevProps.docAgnosticFormat, this.props.docAgnosticFormat)) {
            const hash = window.location.hash.slice(1);
            utils.scrollToHash(hash, constants.SCROLL_CONTAINER_ID);
        }
    }
    public render(): React.ReactNode {
        const subMenus = _.values(this.props.docsInfo.markdownMenu);
        const orderedSectionNames = _.flatten(subMenus);

        const typeDefinitionByName = this.props.docsInfo.getTypeDefinitionsByName(this.props.docAgnosticFormat);
        const renderedSections = _.map(orderedSectionNames, this._renderSection.bind(this, typeDefinitionByName));

        return (
            <div>
                <div id={constants.SCROLL_TOP_ID} />
                {renderedSections}
            </div>
        );
    }
    private _renderSection(typeDefinitionByName: TypeDefinitionByName, sectionName: string): React.ReactNode {
        const markdownVersions = _.keys(this.props.docsInfo.sectionNameToMarkdownByVersion);
        const eligibleVersions = _.filter(markdownVersions, mdVersion => {
            return semver.lte(mdVersion, this.props.selectedVersion);
        });
        if (_.isEmpty(eligibleVersions)) {
            throw new Error(
                `No eligible markdown sections found for ${this.props.docsInfo.displayName} version ${
                    this.props.selectedVersion
                }.`,
            );
        }
        const sortedEligibleVersions = eligibleVersions.sort(semver.rcompare.bind(semver));
        const closestVersion = sortedEligibleVersions[0];
        const markdownFileIfExists = this.props.docsInfo.sectionNameToMarkdownByVersion[closestVersion][sectionName];
        if (markdownFileIfExists !== undefined) {
            // Special-case replace the `introduction` sectionName with the package name
            const isIntroductionSection = sectionName === 'introduction';
            const headerSize = isIntroductionSection ? HeaderSizes.H1 : HeaderSizes.H3;
            return (
                <MarkdownSection
                    key={`markdown-section-${sectionName}`}
                    sectionName={sectionName}
                    headerSize={headerSize}
                    markdownContent={markdownFileIfExists}
                    alternativeSectionTitle={isIntroductionSection ? this.props.docsInfo.displayName : undefined}
                />
            );
        }

        const docSection = this.props.docAgnosticFormat[sectionName];
        if (docSection === undefined) {
            return null;
        }

        const isExportedFunctionSection =
            docSection.functions.length === 1 &&
            _.isEmpty(docSection.types) &&
            _.isEmpty(docSection.methods) &&
            _.isEmpty(docSection.constructors) &&
            _.isEmpty(docSection.properties) &&
            _.isEmpty(docSection.events);

        const sortedTypes = _.sortBy(docSection.types, 'name');
        const typeDefs = _.map(sortedTypes, (customType, i) => {
            return (
                <TypeDefinition
                    sectionName={sectionName}
                    key={`type-${customType.name}-${i}`}
                    customType={customType}
                    docsInfo={this.props.docsInfo}
                    typeDefinitionByName={typeDefinitionByName}
                    isInPopover={false}
                />
            );
        });

        const sortedProperties = _.sortBy(docSection.properties, 'name');
        const propertyDefs = _.map(
            sortedProperties,
            this._renderProperty.bind(this, sectionName, typeDefinitionByName),
        );

        const sortedMethods = _.sortBy(docSection.methods, 'name');
        const methodDefs = _.map(sortedMethods, method => {
            return this._renderSignatureBlocks(method, sectionName, typeDefinitionByName);
        });

        const sortedFunctions = _.sortBy(docSection.functions, 'name');
        const functionDefs = _.map(sortedFunctions, func => {
            return this._renderSignatureBlocks(func, sectionName, typeDefinitionByName);
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
        const headerStyle: React.CSSProperties = {
            fontWeight: 100,
        };
        return (
            <div key={`section-${sectionName}`} className="py2 pr3 md-pl2 sm-pl3">
                <div className="flex pb2">
                    <div style={{ marginRight: 7 }}>
                        <SectionHeader sectionName={sectionName} />
                    </div>
                    {this._renderNetworkBadgesIfExists(sectionName)}
                </div>
                {docSection.comment && <Comment comment={docSection.comment} />}
                {!_.isEmpty(docSection.constructors) && (
                    <div>
                        <h2 style={headerStyle}>Constructor</h2>
                        {this._renderConstructors(docSection.constructors, sectionName, typeDefinitionByName)}
                    </div>
                )}
                {!_.isEmpty(docSection.properties) && (
                    <div>
                        <h2 style={headerStyle}>Properties</h2>
                        <div>{propertyDefs}</div>
                    </div>
                )}
                {!_.isEmpty(docSection.methods) && (
                    <div>
                        <h2 style={headerStyle}>Methods</h2>
                        <div>{methodDefs}</div>
                    </div>
                )}
                {!_.isEmpty(docSection.functions) && (
                    <div>
                        {!isExportedFunctionSection && (
                            <div style={{ ...headerStyle, fontSize: '1.5em' }}>Functions</div>
                        )}
                        <div>{functionDefs}</div>
                    </div>
                )}
                {docSection.events !== undefined && docSection.events.length > 0 && (
                    <div>
                        <h2 style={headerStyle}>Events</h2>
                        <div>{eventDefs}</div>
                    </div>
                )}
                {docSection.externalExportToLink !== undefined &&
                    this._renderExternalExports(docSection.externalExportToLink)}
                {typeDefs !== undefined && typeDefs.length > 0 && (
                    <div>
                        <div>{typeDefs}</div>
                    </div>
                )}
                <div
                    style={{
                        width: '100%',
                        height: 1,
                        backgroundColor: colors.grey300,
                        marginTop: 32,
                        marginBottom: 12,
                    }}
                />
            </div>
        );
    }
    private _renderExternalExports(externalExportToLink: ExternalExportToLink): React.ReactNode {
        const externalExports = _.map(externalExportToLink, (link: string, exportName: string) => {
            return (
                <div className="pt2" key={`external-export-${exportName}`}>
                    <code className={`hljs ${constants.TYPE_TO_SYNTAX[this.props.docsInfo.type]}`}>
                        {`import { `}
                        <Link to={link} shouldOpenInNewTab={true} fontColor={colors.lightBlueA700}>
                            {exportName}
                        </Link>
                        {` } from '${this.props.docsInfo.packageName}'`}
                    </code>
                </div>
            );
        });
        return <div>{externalExports}</div>;
    }
    private _renderNetworkBadgesIfExists(sectionName: string): React.ReactNode {
        if (this.props.docsInfo.type !== SupportedDocJson.SolDoc) {
            return null;
        }

        const networkToAddressByContractName = this.props.docsInfo.contractsByVersionByNetworkId[
            this.props.selectedVersion
        ];
        const badges = _.map(
            networkToAddressByContractName,
            (addressByContractName: AddressByContractName, networkName: string) => {
                const contractAddress = addressByContractName[sectionName];
                if (contractAddress === undefined) {
                    return null;
                }
                const linkIfExists = utils.getEtherScanLinkIfExists(
                    contractAddress,
                    constants.NETWORK_ID_BY_NAME[networkName],
                    EtherscanLinkSuffixes.Address,
                );
                return (
                    <div style={{ marginTop: 8 }}>
                        <Link
                            key={`badge-${networkName}-${sectionName}`}
                            to={linkIfExists}
                            shouldOpenInNewTab={true}
                            fontColor={colors.white}
                        >
                            <Badge title={networkName} backgroundColor={networkNameToColor[networkName]} />
                        </Link>
                    </div>
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
            return this._renderSignatureBlocks(constructor, sectionName, typeDefinitionByName);
        });
        return <div>{constructorDefs}</div>;
    }
    private _renderProperty(
        sectionName: string,
        typeDefinitionByName: TypeDefinitionByName,
        property: Property,
    ): React.ReactNode {
        return (
            <PropertyBlock
                key={`property-${property.name}-${property.type.name}`}
                property={property}
                sectionName={sectionName}
                docsInfo={this.props.docsInfo}
                sourceUrl={this.props.sourceUrl}
                selectedVersion={this.props.selectedVersion}
                typeDefinitionByName={typeDefinitionByName}
            />
        );
    }
    private _renderSignatureBlocks(
        method: SolidityMethod | TypescriptFunction | TypescriptMethod,
        sectionName: string,
        typeDefinitionByName: TypeDefinitionByName,
    ): React.ReactNode {
        return (
            <SignatureBlock
                key={`method-${method.name}-${sectionName}`}
                sectionName={sectionName}
                method={method}
                typeDefinitionByName={typeDefinitionByName}
                libraryVersion={this.props.selectedVersion}
                docsInfo={this.props.docsInfo}
                sourceUrl={this.props.sourceUrl}
            />
        );
    }
}
