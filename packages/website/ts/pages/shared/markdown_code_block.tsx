import * as _ from 'lodash';
import * as React from 'react';
import * as HighLight from 'react-highlight';

interface MarkdownCodeBlockProps {
    literal: string;
    language: string;
}

interface MarkdownCodeBlockState {}

export class MarkdownCodeBlock extends React.Component<MarkdownCodeBlockProps, MarkdownCodeBlockState> {
    // Re-rendering a codeblock causes any use selection to become de-selected. This is annoying when trying
    // to copy-paste code examples. We therefore noop re-renders on this component if it's props haven't changed.
    public shouldComponentUpdate(nextProps: MarkdownCodeBlockProps, nextState: MarkdownCodeBlockState) {
        return nextProps.literal !== this.props.literal || nextProps.language !== this.props.language;
    }
    public render() {
        return (
            <span style={{fontSize: 16}}>
                <HighLight
                    className={this.props.language || 'javascript'}
                >
                    {this.props.literal}
                </HighLight>
            </span>
        );
    }
}
