import * as React from 'react';
import { hydrate, render } from 'react-dom';
import * as Loadable from 'react-loadable';

import { context } from 'ts/context/compiler';

import { Base } from 'ts/components/Base';
import { Breakout } from 'ts/components/Breakout';
import { Code } from 'ts/components/Code';
import { Compiler as CompilerComponent } from 'ts/components/Compiler';
import { Content } from 'ts/components/Content';
import { ContentBlock } from 'ts/components/ContentBlock';
import { Hero } from 'ts/components/Hero';
import { InlineCode } from 'ts/components/InlineCode';
import { Lead } from 'ts/components/Typography';

const Animation = Loadable({
    loader: () => System.import(/* webpackChunkName: 'compiler-animation' */ 'ts/components/Animations/Compiler'),
    loading: () => <div />,
    delay: 1000,
    render(loadable: { Animation: any }): React.ReactNode {
        const Component = loadable.Animation;
        return <Component />;
    },
});

const Compiler: React.StatelessComponent<{}> = () => (
    <Base context={context}>
        <Hero>
            <Animation />
        </Hero>
        <CompilerComponent />
        <Content>
            <ContentBlock main={true} title="Get started" />
            <ContentBlock title="Install">
                <Breakout>
                    <Code canCopy={true}>npm install @0x/sol-compiler --g</Code>
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
        <Content dark={true}>
            <ContentBlock main={true} title="Artifacts">
                <Lead>
                    Sol compiler uses solidity standard JSON output format for the artifacts. This way, you can define
                    which parts of the artifact you need.
                </Lead>
            </ContentBlock>

            <ContentBlock title="Production">
                <p>
                    Sol compiler uses solidity standard JSON output format for the artifacts. This way, you can define
                    which parts of the artifact you need.
                </p>
                <Breakout>
                    <Code isLight={true} language="json" isEtc={true}>
                        {`{
    "compilerSettings": {
        "outputSelection": {
            "*": {
                "*": ["abi"]
            }
        }
    }
}`}
                    </Code>
                </Breakout>
                <Breakout>
                    <Code isLight={true} language="json" isEtc={true}>
                        {`{
    "compilerOutput": {
        "abi": [...],
    },
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
                    <Code isLight={true} language="json" isEtc={true}>
                        {`{
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
}`}
                    </Code>
                </Breakout>

                <Breakout>
                    <Code isLight={true} language="json" isEtc={true}>
                        {`{
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
}`}
                    </Code>
                </Breakout>
            </ContentBlock>
        </Content>
    </Base>
);

const root = document.getElementById('app');

if (root.hasChildNodes()) {
    hydrate(<Compiler />, root);
} else {
    render(<Compiler />, root);
}
