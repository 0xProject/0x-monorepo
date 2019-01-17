import * as React from 'react';
import { hydrate, render } from 'react-dom';
import * as Loadable from 'react-loadable';

import { context } from 'ts/context/compiler';

import { Base } from 'ts/components/base';
import { Breakout } from 'ts/components/breakout';
import { CallToAction } from 'ts/components/call_to_action';
import { Code } from 'ts/components/code';
import { Compiler as CompilerComponent } from 'ts/components/compiler';
import { Content } from 'ts/components/content';
import { ContentBlock } from 'ts/components/content-block';
import { Hero } from 'ts/components/hero';
import { InlineCode } from 'ts/components/inline-code';
import { Lead } from 'ts/components/typography';

const Animation = Loadable({
    loader: () => System.import(/* webpackChunkName: 'compiler-animation' */ 'ts/components/animations/compiler'),
    loading: () => <div />,
    delay: 1000,
    render(loadable: { CompilerAnimation: any }): React.ReactNode {
        const Component = loadable.CompilerAnimation;
        return <Component />;
    },
});

const SOLIDITY_INPUT_FORMAT_DOCS =
    'https://solidity.readthedocs.io/en/v0.4.24/using-the-compiler.html#compiler-input-and-output-json-description';

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
                    <Code canCopy={true}>cd /your_project_dir && sol-compiler</Code>
                </Breakout>
            </ContentBlock>

            <ContentBlock title="Configure">
                <p>
                    Configure via a <InlineCode>compiler.json</InlineCode> file.
                </p>
                <Breakout>
                    <Code canCopy={true}>mkdir compiler.json</Code>
                </Breakout>
                <p>Example of settings:</p>
                <Breakout>
                    <Code language="json" canCopy={true}>
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
                    Sol compiler uses{' '}
                    <a href={SOLIDITY_INPUT_FORMAT_DOCS} target="_blank">
                        Solidity standard JSON input format
                    </a>{' '}
                    to specify what to include in the generated artifacts. This way, you have complete flexibility on
                    what is included.
                </Lead>
            </ContentBlock>

            <ContentBlock title="Production">
                <p>
                    In production, you want to optimize for a small bundle size, so your compiler.json config would
                    instruct sol-compiler to only output the contract ABI.
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
                    In development, you need to use profiler and other dev tools that require more information from the
                    artifact. To do this, you can specify that the artifact also contain the bytecode, deployed bytecode
                    and source maps.
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
        <div style={{ paddingTop: '5rem' }}>
            <CallToAction />
        </div>
    </Base>
);

const root = document.getElementById('app');

if (root.hasChildNodes()) {
    hydrate(<Compiler />, root);
} else {
    render(<Compiler />, root);
}
