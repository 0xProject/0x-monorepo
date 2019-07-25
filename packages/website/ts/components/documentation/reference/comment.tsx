import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import { MarkdownCodeBlock } from 'ts/components/documentation/shared/markdown_code_block';
import { colors } from 'ts/utils/colors';

export interface CommentProps {
    comment: string;
    className?: string;
}

const defaultProps = {
    className: '',
};

export const Comment: React.SFC<CommentProps> = (props: CommentProps) => {
    return (
        <div className={`${props.className} comment`} style={{ color: colors.greyTheme }}>
            <ReactMarkdown source={props.comment} renderers={{ code: MarkdownCodeBlock }} />
        </div>
    );
};

Comment.defaultProps = defaultProps;
