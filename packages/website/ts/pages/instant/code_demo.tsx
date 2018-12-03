import * as React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';

const CustomPre = styled.pre`
    margin: 0px;
    line-height: 24px;
    overflow: scroll;
    width: 600px;
    height: 100%;
    max-height: 800px;
    border-radius: 4px;
    code {
        background-color: inherit !important;
        border-radius: 0px;
        font-family: 'Roboto Mono', sans-serif;
        border: none;
    }
    code:first-of-type {
        background-color: #2a2a2a !important;
        color: #999;
        min-height: 100%;
        text-align: center;
        padding-right: 5px !important;
        padding-left: 5px;
        margin-right: 15px;
        line-height: 25px;
        padding-top: 10px;
    }
    code:last-of-type {
        position: relative;
        top: 10px;
    }
`;

const customStyle = {
    'hljs-comment': {
        color: '#7e7887',
    },
    'hljs-quote': {
        color: '#7e7887',
    },
    'hljs-variable': {
        color: '#be4678',
    },
    'hljs-template-variable': {
        color: '#be4678',
    },
    'hljs-attribute': {
        color: '#be4678',
    },
    'hljs-regexp': {
        color: '#be4678',
    },
    'hljs-link': {
        color: '#be4678',
    },
    'hljs-tag': {
        color: '#61f5ff',
    },
    'hljs-name': {
        color: '#61f5ff',
    },
    'hljs-selector-id': {
        color: '#be4678',
    },
    'hljs-selector-class': {
        color: '#be4678',
    },
    'hljs-number': {
        color: '#c994ff',
    },
    'hljs-meta': {
        color: '#aa573c',
    },
    'hljs-built_in': {
        color: '#aa573c',
    },
    'hljs-builtin-name': {
        color: '#aa573c',
    },
    'hljs-literal': {
        color: '#aa573c',
    },
    'hljs-type': {
        color: '#aa573c',
    },
    'hljs-params': {
        color: '#aa573c',
    },
    'hljs-string': {
        color: '#bcff88',
    },
    'hljs-symbol': {
        color: '#2a9292',
    },
    'hljs-bullet': {
        color: '#2a9292',
    },
    'hljs-title': {
        color: '#576ddb',
    },
    'hljs-section': {
        color: '#576ddb',
    },
    'hljs-keyword': {
        color: '#955ae7',
    },
    'hljs-selector-tag': {
        color: '#955ae7',
    },
    'hljs-deletion': {
        color: '#19171c',
        display: 'inline-block',
        width: '100%',
        backgroundColor: '#be4678',
    },
    'hljs-addition': {
        color: '#19171c',
        display: 'inline-block',
        width: '100%',
        backgroundColor: '#2a9292',
    },
    hljs: {
        display: 'block',
        overflowX: 'hidden',
        background: colors.instantSecondaryBackground,
        color: 'white',
        fontSize: '12px',
    },
    'hljs-emphasis': {
        fontStyle: 'italic',
    },
    'hljs-strong': {
        fontWeight: 'bold',
    },
};

export interface CodeDemoProps {
    children: string;
}

export const CodeDemo: React.StatelessComponent<CodeDemoProps> = props => (
    <SyntaxHighlighter language="html" style={customStyle} showLineNumbers={true} PreTag={CustomPre}>
        {props.children}
    </SyntaxHighlighter>
);
