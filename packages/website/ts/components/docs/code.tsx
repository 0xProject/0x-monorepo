import React, { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { Button } from 'ts/components/button';
import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';
import { zIndex } from 'ts/style/z_index';

interface ICodeProps {
    children: string;
    isRunnable?: boolean;
    lang?: 'html | typescript | solidity | python';
}

export const Code: React.FC<ICodeProps> = ({ children, lang = 'typescript', isRunnable = false }) => {
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const copyButtonText = isCopied ? 'Copied!' : 'Copy';

    const handleCopyClick = () => setIsCopied(true);

    return (
        <CodeWrapper>
            <ButtonWrapper>
                <CopyToClipboard text={children} onCopy={handleCopyClick}>
                    <StyledButton>{copyButtonText}</StyledButton>
                </CopyToClipboard>
            </ButtonWrapper>
            <SyntaxHighlighter
                language={lang}
                customStyle={customStyle}
                style={style}
                showLineNumbers={false}
                PreTag={CustomPre}
                wrapLines={true}
            >
                {children}
            </SyntaxHighlighter>

            {!isRunnable && (
                <RunWrapper>
                    <ButtonsWrapper>
                        <RunButton bgColor={colors.brandDark} color="white">
                            Run
                        </RunButton>
                        <RunButton bgColor="white" color={colors.brandDark}>
                            Reset
                        </RunButton>
                    </ButtonsWrapper>
                    <Result />
                </RunWrapper>
            )}
        </CodeWrapper>
    );
};

const GUTTER = '10px';

const customStyle = {
    overflowX: 'scroll',
    padding: '20px',
};

const RunWrapper = styled.div`
    display: flex;
    padding: ${GUTTER};
`;

const ButtonsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-right: ${GUTTER};
`;

const RunButton = styled(Button)`
    width: 112px;
    height: 40px;
    line-height: 0;

    &:first-of-type {
        margin-bottom: 4px;
    }
`;

const Result = styled.div`
    background: white;
    border: 1px solid ${colors.brandDark};
    border-radius: 4px;
    width: 100%;
    min-height: 100%;
`;

const CustomPre = styled.pre`
    border-radius: 4px;
    background-color: white;

    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE 10+ */

    &::-webkit-scrollbar {
        /* WebKit */
        width: 0;
        height: 0;
    }

    code {
        border: none;
        font-family: 'Roboto Mono', sans-serif;
        font-size: 0.875rem;
        line-height: 1.25em;
    }
`;

const StyledButton = styled(Button)`
    border-radius: 4px;
    background: white;
    border: 1px solid #eaeaea;
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

const CodeWrapper = styled.div`
    position: relative;
    max-width: 702px;
    background-color: ${colors.backgroundLight};
`;

const style = {
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
