import * as _ from 'lodash';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import { Element as ScrollElement } from 'react-scroll';

import { HeaderSizes } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { utils } from 'ts/utils/utils';

import { AnchorTitle } from './anchor_title';
import { Link } from './link';
import { MarkdownCodeBlock } from './markdown_code_block';
import { MarkdownLinkBlock } from './markdown_link_block';
import { MarkdownParagraphBlock } from './markdown_paragraph_block';

export interface MarkdownSectionProps {
    sectionName: string;
    markdownContent: string;
    headerSize?: HeaderSizes;
    githubLink?: string;
    alternativeSectionTitle?: string;
}

interface DefaultMarkdownSectionProps {
    headerSize: HeaderSizes;
}

type PropsWithDefaults = MarkdownSectionProps & DefaultMarkdownSectionProps;

export interface MarkdownSectionState {
    shouldShowAnchor: boolean;
}

export class MarkdownSection extends React.Component<MarkdownSectionProps, MarkdownSectionState> {
    public static defaultProps: Partial<MarkdownSectionProps> = {
        headerSize: HeaderSizes.H3,
    };
    constructor(props: MarkdownSectionProps) {
        super(props);
        this.state = {
            shouldShowAnchor: false,
        };
    }
    public render(): React.ReactNode {
        const { sectionName, markdownContent, headerSize, githubLink } = this.props as PropsWithDefaults;

        const id = utils.getIdFromName(sectionName);
        const formattedSectionName = utils.convertCamelCaseToSpaces(sectionName);
        const title =
            this.props.alternativeSectionTitle !== undefined
                ? this.props.alternativeSectionTitle
                : _.capitalize(formattedSectionName);
        return (
            <div
                className="md-px1 sm-px2 overflow-hidden"
                onMouseOver={this._setAnchorVisibility.bind(this, true)}
                onMouseOut={this._setAnchorVisibility.bind(this, false)}
            >
                <ScrollElement name={id} style={{ paddingBottom: 20 }}>
                    <div className="clearfix" style={{ paddingTop: 30, paddingBottom: 20 }}>
                        <div className="col lg-col-8 md-col-8 sm-col-12">
                            <span style={{ color: colors.grey700 }}>
                                <AnchorTitle
                                    headerSize={headerSize}
                                    title={title}
                                    id={id}
                                    shouldShowAnchor={this.state.shouldShowAnchor}
                                />
                            </span>
                        </div>
                        <div className="col col-4 sm-hide xs-hide right-align pr3" style={{ height: 28 }}>
                            {githubLink !== undefined && (
                                <div style={{ lineHeight: 2.1 }}>
                                    <Link to={githubLink} shouldOpenInNewTab={true} fontColor={colors.linkBlue}>
                                        Edit on Github
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                    <ReactMarkdown
                        source={markdownContent}
                        escapeHtml={false}
                        renderers={{
                            code: MarkdownCodeBlock,
                            link: MarkdownLinkBlock,
                            paragraph: MarkdownParagraphBlock,
                        }}
                    />
                    <div
                        style={{
                            width: '100%',
                            height: 1,
                            backgroundColor: colors.grey300,
                            marginTop: 32,
                        }}
                    />
                </ScrollElement>
            </div>
        );
    }
    private _setAnchorVisibility(shouldShowAnchor: boolean): void {
        this.setState({
            shouldShowAnchor,
        });
    }
}
