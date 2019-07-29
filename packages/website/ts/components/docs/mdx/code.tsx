import * as React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { Button } from 'ts/components/button';
import { CodeRun } from 'ts/components/docs/mdx/code_run';

import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';

interface ICodeProps {
    children: string;
    className?: string;
    canRun?: boolean;
}

export const Code: React.FC<ICodeProps> = ({ children, className = 'language-typescript', canRun = false }) => {
    const [isCopied, setIsCopied] = React.useState<boolean>(false);
    const copyButtonText = isCopied ? 'Copied!' : 'Copy';

    // Passing in LANGUAGE to code in mdx results in classname 'language-<LANGUAGE>'
    const language = className.replace('language-', '');

    const handleCopyClick = () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 500);
    };

    const customStyle = {
        overflowX: 'scroll',
        padding: canRun ? '20px' : '10px',
        backgroundColor: canRun ? 'white' : 'none',
    };

    return (
        <>
            <CopyToClipboard text={children} onCopy={handleCopyClick}>
                <CopyButton>{copyButtonText}</CopyButton>
            </CopyToClipboard>

            <CodeWrapper>
                <SyntaxHighlighter
                    language={language}
                    customStyle={customStyle}
                    style={style}
                    CodeTag={CodeTag}
                    PreTag={PreTag}
                    showLineNumbers={false}
                    wrapLines={true}
                >
                    {children}
                </SyntaxHighlighter>

                {canRun && <CodeRun />}
            </CodeWrapper>
        </>
    );
};

const GUTTER = '10px';
const BORDER_RADIUS = '4px';

const CodeWrapper = styled.div`
    clear: both;
    max-width: 100%;
    margin-bottom: 1.875rem;
    padding: ${GUTTER};
    background-color: ${colors.backgroundLight};
    border-radius: 0 ${BORDER_RADIUS} ${BORDER_RADIUS};
`;

const PreTag = styled.pre`
    border: 1px solid ${colors.backgroundLight};
    border-radius: ${BORDER_RADIUS};

    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE 10+ */

    &::-webkit-scrollbar {
        width: 0;
        height: 0;
    }
`;

const CodeTag = styled.code`
    border: none;
    font-family: 'Roboto Mono', sans-serif;

    span {
        font-size: 14px;
        line-height: 20px;
        display: flex;
    }
`;

const CopyButton = styled(Button).attrs({
    isTransparent: true,
})`
    float: right;
    height: 32px;
    padding: 0 12px;
    margin-bottom: 13px;
    font-size: 14px;
    font-weight: 300;
    border: 1px solid ${colors.beigeWhite};
    border-radius: ${BORDER_RADIUS};
    color: ${colors.brandDark};
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
