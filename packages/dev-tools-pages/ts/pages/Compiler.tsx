import * as React from 'react';
import { render, hydrate } from 'react-dom';

import { Lead } from 'ts/components/Typography';
import context from 'ts/context/compiler';
import Base from 'ts/components/Base';
import Content from 'ts/components/Content';
import ContentBlock from 'ts/components/ContentBlock';
import Code from 'ts/components/Code';
import InlineCode from 'ts/components/InlineCode';
import CompilerComponent from 'ts/components/Compiler';
import Breakout from 'ts/components/Breakout';

function Compiler() {
    return (
        <Base context={context}>
            <CompilerComponent />
            <Content>
                <ContentBlock main title="Get started" />
                <ContentBlock title="Install">
                    <Breakout>
                        <Code copy>npm install @0x/sol-compiler --g</Code>
                    </Breakout>
                </ContentBlock>

                <ContentBlock title="Run">
                    <Breakout>
                        <Code>cd /your_project_dir && sol-compiler</Code>
                    </Breakout>
                </ContentBlock>

                <ContentBlock title="Configure">
                    <p>
                        Configure via a <InlineCode>compiler.json</InlineCode> file.
                    </p>
                    <Breakout>
                        <Code>mkdir compiler.json</Code>
                    </Breakout>
                    <p>Example of settings:</p>
                    <Breakout>
                        <Code language="json">
                            {`{
    "contractsDir": "contracts",
    "artifactsDir": "artifacts",
    "contracts": "*",
    "compilerSettings": {
        "optimizer": { "enabled": false },
        "outputSelection": {
            "*": {
                "*": ["abi", "evm.bytecode.object"]
            }
        }
    }
}`}
                        </Code>
                    </Breakout>
                </ContentBlock>
            </Content>
            <Content dark>
                <ContentBlock main title="Artifacts">
                    <Lead>
                        Sol compiler uses solidity standard JSON output format for the artifacts. This way, you can
                        define which parts of the artifact you need.
                    </Lead>
                </ContentBlock>

                <ContentBlock title="Production">
                    <p>
                        Sol compiler uses solidity standard JSON output format for the artifacts. This way, you can
                        define which parts of the artifact you need.
                    </p>
                    <Breakout>
                        <Code light language="json">
                            {`{
    ...
    "compilerSettings": {
        "outputSelection": {
            "*": {
                "*": ["abi"]
            }
        }
    }
    ...
}`}
                        </Code>
                    </Breakout>
                    <Breakout>
                        <Code light language="json">
                            {`{
    ...
    "compilerOutput": {
        "abi": [...],
    },
    ...
}`}
                        </Code>
                    </Breakout>
                </ContentBlock>
                <ContentBlock title="Development">
                    <p>
                        Sometimes you need to use some debuggers or other dev tools and you’ll need more info in the
                        artifact.
                    </p>
                    <Breakout>
                        <Code light language="json">
                            {`{
    ...
    "compilerSettings": {
        "outputSelection": {
            "*": {
                "*": [
                    "abi",
                    "evm.bytecode.object",
                    "evm.bytecode.sourceMap",
                    "evm.deployedBytecode.object",
                    "evm.deployedBytecode.sourceMap"
                ]
            }
        }
    }
    ...
}`}
                        </Code>
                    </Breakout>

                    <Breakout>
                        <Code light language="json">
                            {`{
    ...
    "compilerOutput": {
        "abi": [...],
        "evm": {
            "bytecode": {
                "object": "0xdeadbeef",
                "sourceMap": "26:480:..."
            },
            "deployedBytecode": {
                "object": "0xdeadbeef",
                "sourceMap": "26:480:0..."
            }
        }
    }
    "sources": {
        "Migrations.sol": {
            "id": 0
        }
    },
    ...
}`}
                        </Code>
                    </Breakout>
                </ContentBlock>
            </Content>
        </Base>
    );
}

const root = document.getElementById('app');

if (root.hasChildNodes()) {
    hydrate(<Compiler />, root);
} else {
    render(<Compiler />, root);
}
