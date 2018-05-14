import * as _ from 'lodash';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import { Element as ScrollElement } from 'react-scroll';

import { HeaderSizes } from '../types';
import { colors } from '../utils/colors';
import { utils } from '../utils/utils';

import { AnchorTitle } from './anchor_title';
import { MarkdownCodeBlock } from './markdown_code_block';
import { MarkdownLinkBlock } from './markdown_link_block';

export interface MarkdownSectionProps {
    sectionName: string;
    markdownContent: string;
    headerSize?: HeaderSizes;
    githubLink?: string;
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
        const finalSectionName = utils.convertDashesToSpaces(sectionName);
        return (
            <div
                className="md-px1 sm-px2 overflow-hidden"
                onMouseOver={this._setAnchorVisibility.bind(this, true)}
                onMouseOut={this._setAnchorVisibility.bind(this, false)}
            >
                <ScrollElement name={id}>
                    <div className="clearfix pt3">
                        <div className="col lg-col-8 md-col-8 sm-col-12">
                            <span style={{ textTransform: 'capitalize', color: colors.grey700 }}>
                                <AnchorTitle
                                    headerSize={headerSize}
                                    title={finalSectionName}
                                    id={id}
                                    shouldShowAnchor={this.state.shouldShowAnchor}
                                />
                            </span>
                        </div>
                        <div className="col col-4 sm-hide xs-hide right-align pr3" style={{ height: 28 }}>
                            {!_.isUndefined(githubLink) && (
                                <a
                                    href={githubLink}
                                    target="_blank"
                                    style={{ color: colors.linkBlue, textDecoration: 'none', lineHeight: 2.1 }}
                                >
                                    Edit on Github
                                </a>
                            )}
                        </div>
                    </div>
                    <hr style={{ border: `1px solid ${colors.lightestGrey}` }} />
                    <ReactMarkdown
                        source={markdownContent}
                        escapeHtml={false}
                        renderers={{
                            code: MarkdownCodeBlock,
                            link: MarkdownLinkBlock,
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
