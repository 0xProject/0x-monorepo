import * as React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';

import { Button } from 'ts/components/button';
import { CodeRun } from 'ts/components/docs/mdx/code_run';

import { colors } from 'ts/style/colors';
import { docs } from 'ts/style/docs';
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
    const language = className.replace(/language-/, '');

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
    margin-bottom: ${docs.marginBottom};
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

    /* Targeting newline created by markdown at the end of each code block */
    & > span:last-of-type {
        display: none;
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
    hljs: {
        display: 'block',
        overflowX: 'hidden',
        background: colors.backgroundLight,
        fontSize: '14px',
        lineHeight: '1.5',
        padding: '20px',
    },
    'hljs-keyword': {
        color: '#1C297D',
    },
    'hljs-literal': {
        color: '#1C297D',
    },
    'hljs-symbol': {
        color: '#1C297D',
    },
    'hljs-name': {
        color: '#1C297D',
    },
    'hljs-link': {
        color: '#1C297D',
        textDecoration: 'underline',
    },
    'hljs-built_in': {
        color: '#0E7C7B',
    },
    'hljs-type': {
        color: '#0E7C7B',
    },
    'hljs-number': {
        color: '#EA526F',
    },
    'hljs-class': {
        color: '#EA526F',
    },
    'hljs-string': {
        color: '#CD8987',
    },
    'hljs-meta-string': {
        color: '#CD8987',
    },
    'hljs-regexp': {
        color: '#9A5334',
    },
    'hljs-template-tag': {
        color: '#9A5334',
    },
    'hljs-subst': {
        color: '#12130F',
    },
    'hljs-function': {
        color: '#12130F',
    },
    'hljs-title': {
        color: '#12130F',
    },
    'hljs-params': {
        color: '#12130F',
    },
    'hljs-formula': {
        color: '#12130F',
    },
    'hljs-comment': {
        color: '#6A8D73',
        fontStyle: 'italic',
    },
    'hljs-quote': {
        color: '#6A8D73',
        fontStyle: 'italic',
    },
    'hljs-doctag': {
        color: '#70967A',
    },
    'hljs-meta': {
        color: '#AAABBC',
    },
    'hljs-meta-keyword': {
        color: '#AAABBC',
    },
    'hljs-tag': {
        color: '#AAABBC',
    },
    'hljs-variable': {
        color: '#BD63C5',
    },
    'hljs-template-variable': {
        color: '#BD63C5',
    },
    'hljs-attr': {
        color: '#90BEDE',
    },
    'hljs-attribute': {
        color: '#90BEDE',
    },
    'hljs-builtin-name': {
        color: '#90BEDE',
    },
    'hljs-section': {
        color: 'gold',
    },
    'hljs-emphasis': {
        fontStyle: 'italic',
    },
    'hljs-strong': {
        fontWeight: 'bold',
    },
    'hljs-bullet': {
        color: '#E4B363',
    },
    'hljs-selector-tag': {
        color: '#E4B363',
    },
    'hljs-selector-id': {
        color: '#E4B363',
    },
    'hljs-selector-class': {
        color: '#E4B363',
    },
    'hljs-selector-attr': {
        color: '#E4B363',
    },
    'hljs-selector-pseudo': {
        color: '#E4B363',
    },
    'hljs-addition': {
        backgroundColor: '#D5E2BC',
        display: 'inline-block',
        width: '100%',
    },
    'hljs-deletion': {
        backgroundColor: '#EBB3A9',
        display: 'inline-block',
        width: '100%',
    },
};
