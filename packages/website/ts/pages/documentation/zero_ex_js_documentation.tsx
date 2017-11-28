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
    KindString,
    Property,
    ScreenWidths,
    Styles,
    TypeDefinitionByName,
    TypeDocNode,
    TypescriptMethod,
    ZeroExJsDocSections,
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
const DOC_JSON_ROOT = constants.S3_0XJS_DOCUMENTATION_JSON_ROOT;

const sectionNameToMarkdown = {
    [ZeroExJsDocSections.introduction]: IntroMarkdown,
    [ZeroExJsDocSections.installation]: InstallationMarkdown,
    [ZeroExJsDocSections.async]: AsyncMarkdown,
    [ZeroExJsDocSections.errors]: ErrorsMarkdown,
    [ZeroExJsDocSections.versioning]: versioningMarkdown,
};

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
        const menuSubsectionsBySection = _.isUndefined(this.state.docAgnosticFormat)
                                         ? {}
                                         : typeDocUtils.getMenuSubsectionsBySection(this.state.docAgnosticFormat);
        return (
            <div>
                <DocumentTitle title="0x.js Documentation"/>
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    docsVersion={this.props.docsVersion}
                    availableDocVersions={this.props.availableDocVersions}
                    menuSubsectionsBySection={menuSubsectionsBySection}
                    shouldFullWidth={true}
                    doc={Docs.ZeroExJs}
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
                                    topLevelMenu={typeDocUtils.getFinal0xjsMenu(this.props.docsVersion)}
                                    menuSubsectionsBySection={menuSubsectionsBySection}
                                    doc={Docs.ZeroExJs}
                                />
                            </div>
                        </div>
                        <div className="relative col lg-col-9 md-col-9 sm-col-12 col-12">
                            <div
                                id="documentation"
                                style={styles.mainContainers}
                                className="absolute"
                            >
                                <div id="zeroExJSDocs" />
                                <h1 className="md-pl2 sm-pl3">
                                    <a href={constants.GITHUB_0X_JS_URL} target="_blank">
                                        0x.js
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
        const typeDocSection = this.state.docAgnosticFormat[ZeroExJsDocSections.types];
        const typeDefinitionByName = _.keyBy(typeDocSection.types, 'name');

        const subMenus = _.values(constants.menu0xjs);
        const orderedSectionNames = _.flatten(subMenus);
        const sections = _.map(orderedSectionNames, this.renderSection.bind(this, typeDefinitionByName));

        return sections;
    }
    private renderSection(typeDefinitionByName: TypeDefinitionByName, sectionName: string): React.ReactNode {
        const docSection = this.state.docAgnosticFormat[sectionName];

        const markdownFileIfExists = sectionNameToMarkdown[sectionName];
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
                {sectionName === ZeroExJsDocSections.zeroEx && docSection.constructors.length > 0 &&
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
                constructor, ZeroExJsDocSections.zeroEx, constructor.isConstructor, typeDefinitionByName,
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
                    {property.name}: <Type type={property.type} />
                </code>
                <SourceLink
                    version={this.props.docsVersion}
                    source={property.source}
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
            />
        );
    }
    private scrollToHash(): void {
        const hashWithPrefix = this.props.location.hash;
        let hash = hashWithPrefix.slice(1);
        if (_.isEmpty(hash)) {
            hash = 'zeroExJSDocs'; // scroll to the top
        }

        scroller.scrollTo(hash, {duration: 0, offset: 0, containerId: 'documentation'});
    }
    private async fetchJSONDocsFireAndForgetAsync(preferredVersionIfExists?: string): Promise<void> {
        const versionToFileName = await docUtils.getVersionToFileNameAsync(DOC_JSON_ROOT);
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
        const versionDocObj = await docUtils.getJSONDocFileAsync(versionFileNameToFetch, DOC_JSON_ROOT);
        const docAgnosticFormat = typeDocUtils.convertToDocAgnosticFormat((versionDocObj as TypeDocNode));

        this.setState({
            docAgnosticFormat,
        }, () => {
            this.scrollToHash();
        });
    }
}
