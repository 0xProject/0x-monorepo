import { AnchorTitle, HeaderSizes } from '@0xproject/react-shared';
import * as _ from 'lodash';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import { Element as ScrollElement } from 'react-scroll';
import { MarkdownCodeBlock } from 'ts/pages/shared/markdown_code_block';
import { MarkdownLinkBlock } from 'ts/pages/shared/markdown_link_block';
import { colors } from 'ts/utils/colors';
import { utils } from 'ts/utils/utils';

interface MarkdownSectionProps {
    sectionName: string;
    markdownContent: string;
    headerSize?: HeaderSizes;
    githubLink?: string;
}

interface MarkdownSectionState {
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
    public render() {
        const sectionName = this.props.sectionName;
        const id = utils.getIdFromName(sectionName);
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
                                    headerSize={this.props.headerSize}
                                    title={sectionName}
                                    id={id}
                                    shouldShowAnchor={this.state.shouldShowAnchor}
                                />
                            </span>
                        </div>
                        <div className="col col-4 sm-hide xs-hide right-align pr3" style={{ height: 28 }}>
                            {!_.isUndefined(this.props.githubLink) && (
                                <a
                                    href={this.props.githubLink}
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
                        source={this.props.markdownContent}
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
    private _setAnchorVisibility(shouldShowAnchor: boolean) {
        this.setState({
            shouldShowAnchor,
        });
    }
}
