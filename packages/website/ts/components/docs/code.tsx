import * as React from 'react';
import * as CopyToClipboard from 'react-copy-to-clipboard';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { Button } from 'ts/components/button';
import { Container } from 'ts/components/ui/container';
import { colors } from 'ts/style/colors';
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

    code:last-of-type {
        position: relative;
        top: 10px;
        top: 0;
        padding-top: 0;
        display: inline-block;
        font-size: 0.875rem;
        line-height: 1.25em;
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
        color: '#781818',
    },
    'hljs-function': {
        color: '#781818',
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
        color: '#253C90',
    },
    'hljs-selector-tag': {
        color: '#253C90',
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
        background: colors.backgroundLight,
        fontSize: '12px',
        paddingLeft: '20px',
        paddingTop: '20px',
        paddingBottom: '20px',
    },
    'hljs-emphasis': {
        fontStyle: 'italic',
    },
    'hljs-strong': {
        fontWeight: 'bold',
    },
};

export interface CodeProps {
    children: string;
    language?: 'html | typescript | solidity | python';
}

export interface CodeState {
    didCopyCode: boolean;
}

export class Code extends React.Component<CodeProps, CodeState> {
    public static defaultProps = {
        language: 'typescript',
    };
    public state: CodeState = {
        didCopyCode: false,
    };
    public render(): React.ReactNode {
        const copyButtonText = this.state.didCopyCode ? 'Copied!' : 'Copy';
        return (
            <Wrapper>
                <ButtonWrapper>
                    <CopyToClipboard text={this.props.children} onCopy={this._handleCopyClick}>
                        <StyledButton>{copyButtonText}</StyledButton>
                    </CopyToClipboard>
                </ButtonWrapper>
                <SyntaxHighlighter language={this.props.language} style={customStyle} showLineNumbers={false} PreTag={CustomPre}>
                    {this.props.children}
                </SyntaxHighlighter>
            </Wrapper>
        );
    }
    private readonly _handleCopyClick = () => {
        this.setState({ didCopyCode: true });
    };
}

const StyledButton = styled(Button)`
    border-radius: 4px;
    background: #FFFFFF;
    border: 1px solid #EAEAEA;
    color: ${colors.brandDark};
    font-size: 15px;
    font-weight: 300;
    padding: 9px 12px 7px;
`;

const ButtonWrapper = styled.div`
    position: absolute;
    right: 0;
    top: 0;
    z-index: ${zIndex.overlay - 1};
    transform: translateY(calc(-100% + -13px));
`;

const Wrapper = styled.div`
    position: relative;
    max-width: 702px;
`;
