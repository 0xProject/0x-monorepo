import * as React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atelierCaveDark } from 'react-syntax-highlighter/styles/hljs';
import { styled } from 'ts/style/theme';

import { Container } from 'ts/components/ui/container';

const CustomPre = styled.pre`
    code {
        background-color: inherit !important;
        border-radius: 0px;
        font-family: 'Roboto Mono', sans-serif;
        border: none;
    }
`;

export interface CodeDemoProps {}

export const CodeDemo: React.StatelessComponent<CodeDemoProps> = props => {
    const codeString = `<head>
    <script src="http://0x-instant-staging.s3-website-us-east-1.amazonaws.com/main.bundle.js"></script>
</head>
<body>
    <script>
        zeroExInstant.render({
            liquiditySource: 'https://api.relayer.com/sra/v2/',
            affiliateInfo: {
                feeRecipient: '0x50ff5828a216170cf224389f1c5b0301a5d0a230',
                feePercentage: 0.03
            }
        }, 'body');
    </script>
</body>`;
    return (
        <SyntaxHighlighter
            useInlineStyles={true}
            language="html"
            style={atelierCaveDark}
            showLineNumbers={true}
            PreTag={CustomPre}
        >
            {codeString}
        </SyntaxHighlighter>
    );
};
