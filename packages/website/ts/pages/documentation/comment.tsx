import * as _ from 'lodash';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import {MarkdownCodeBlock} from 'ts/pages/shared/markdown_code_block';

interface CommentProps {
    comment: string;
    className?: string;
}

const defaultProps = {
    className: '',
};

export const Comment: React.SFC<CommentProps> = (props: CommentProps) => {
    return (
        <div className={`${props.className} comment`}>
            <ReactMarkdown
                source={props.comment}
                renderers={{CodeBlock: MarkdownCodeBlock}}
            />
        </div>
    );
};
