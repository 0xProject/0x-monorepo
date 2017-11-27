import * as _ from 'lodash';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import {Element as ScrollElement} from 'react-scroll';
import {AnchorTitle} from 'ts/pages/shared/anchor_title';
import {utils} from 'ts/utils/utils';
import {MarkdownCodeBlock} from 'ts/pages/shared/markdown_code_block';
import RaisedButton from 'material-ui/RaisedButton';
import {HeaderSizes} from 'ts/types';

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
                className="pt2 pr3 md-pl2 sm-pl3 overflow-hidden"
                onMouseOver={this.setAnchorVisibility.bind(this, true)}
                onMouseOut={this.setAnchorVisibility.bind(this, false)}
            >
                <ScrollElement name={id}>
                    <div className="clearfix">
                        <div className="col lg-col-8 md-col-8 sm-col-12">
                            <span style={{textTransform: 'capitalize'}}>
                                <AnchorTitle
                                    headerSize={this.props.headerSize}
                                    title={sectionName}
                                    id={id}
                                    shouldShowAnchor={this.state.shouldShowAnchor}
                                />
                            </span>
                        </div>
                        <div className="col col-4 sm-hide xs-hide py2 right-align">
                            {!_.isUndefined(this.props.githubLink) &&
                                <RaisedButton
                                    href={this.props.githubLink}
                                    target="_blank"
                                    label="Edit on Github"
                                    icon={<i className="zmdi zmdi-github" style={{fontSize: 23}} />}
                                />
                            }
                        </div>
                    </div>
                    <ReactMarkdown
                        source={this.props.markdownContent}
                        renderers={{CodeBlock: MarkdownCodeBlock}}
                    />
                </ScrollElement>
            </div>
        );
    }
    private setAnchorVisibility(shouldShowAnchor: boolean) {
        this.setState({
            shouldShowAnchor,
        });
    }
}
