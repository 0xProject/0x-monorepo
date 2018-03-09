import { MarkdownCodeBlock } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';

export interface CommentProps {
    comment: string;
    className?: string;
}

const defaultProps = {
    className: '',
};

export const Comment: React.SFC<CommentProps> = (props: CommentProps) => {
    return (
        <div className={`${props.className} comment`}>
            <ReactMarkdown source={props.comment} renderers={{ code: MarkdownCodeBlock }} />
        </div>
    );
};

Comment.defaultProps = defaultProps;
