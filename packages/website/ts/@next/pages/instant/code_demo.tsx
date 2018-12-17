import * as React from 'react';
import * as CopyToClipboard from 'react-copy-to-clipboard';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { Button } from 'ts/@next/components/button';
import { Container } from 'ts/components/ui/container';
import { styled } from 'ts/style/theme';
import { zIndex } from 'ts/style/z_index';

const CustomPre = styled.pre`
    margin: 0px;
    line-height: 24px;
    overflow: scroll;
    width: 100%;
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
        background-color: #060D0D !important;
        color: #999;
        min-height: 100%;
        text-align: center;
        margin-right: 15px;
        line-height: 25px;
        padding: 10px 7px !important;
    }
    code:last-of-type {
        position: relative;
        top: 10px;
        top: 0;
        padding-top: 11px;
        display: inline-block;
        line-height: 25px;
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
        color: '#61f5ff',
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
        background: '#1B2625',
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

export interface CodeDemoState {
    didCopyCode: boolean;
}

export class CodeDemo extends React.Component<CodeDemoProps, CodeDemoState> {
    public state: CodeDemoState = {
        didCopyCode: false,
    };
    public render(): React.ReactNode {
        const copyButtonText = this.state.didCopyCode ? 'Copied!' : 'Copy';
        return (
            <Container position="relative" height="100%">
                <Container position="absolute" top="10px" right="10px" zIndex={zIndex.overlay - 1}>
                    <CopyToClipboard text={this.props.children} onCopy={this._handleCopyClick}>
                        <StyledButton>
                            {copyButtonText}
                        </StyledButton>
                    </CopyToClipboard>
                </Container>
                <SyntaxHighlighter language="html" style={customStyle} showLineNumbers={true} PreTag={CustomPre}>
                    {this.props.children}
                </SyntaxHighlighter>
            </Container>
        );
    }
    private readonly _handleCopyClick = () => {
        this.setState({ didCopyCode: true });
    };
}

const StyledButton = styled(Button)`
    border-radius: 4px;
    font-size: 15px;
    font-weight: 400;
    padding: 9px 21px 7px;
`;
