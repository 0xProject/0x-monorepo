import * as _ from 'lodash';
import * as React from 'react';
import * as HighLight from 'react-highlight';

interface MarkdownCodeBlockProps {
    literal: string;
    language: string;
}

export function MarkdownCodeBlock(props: MarkdownCodeBlockProps) {
    return (
        <span style={{fontSize: 16}}>
            <HighLight
                className={props.language || 'js'}
            >
                {props.literal}
            </HighLight>
        </span>
    );
}
