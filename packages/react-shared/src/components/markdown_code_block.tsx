import * as React from 'react';
import * as HighLight from 'react-highlight';

export interface MarkdownCodeBlockProps {
    value: string;
    language: string;
}

export interface MarkdownCodeBlockState {}

export class MarkdownCodeBlock extends React.Component<MarkdownCodeBlockProps, MarkdownCodeBlockState> {
    // Re-rendering a codeblock causes any use selection to become de-selected. This is annoying when trying
    // to copy-paste code examples. We therefore noop re-renders on this component if it's props haven't changed.
    public shouldComponentUpdate(nextProps: MarkdownCodeBlockProps, _nextState: MarkdownCodeBlockState): boolean {
        return nextProps.value !== this.props.value || nextProps.language !== this.props.language;
    }
    public render(): React.ReactNode {
        return (
            <span style={{ fontSize: 14 }}>
                <HighLight className={this.props.language || 'javascript'}>{this.props.value}</HighLight>
            </span>
        );
    }
}
