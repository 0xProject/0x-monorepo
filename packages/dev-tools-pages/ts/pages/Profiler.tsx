import * as React from 'react';
import { render, hydrate } from 'react-dom';

import context from 'ts/context/profiler';
import Base from 'ts/components/Base';
import Content from 'ts/components/Content';
import ContentBlock from 'ts/components/ContentBlock';
import { Tabs, TabBlock } from 'ts/components/Tabs';
import Code from 'ts/components/Code';
import InlineCode from 'ts/components/InlineCode';
import List from 'ts/components/List';
import Intro from 'ts/components/Intro';

function Profiler() {
    return (
        <Base context={context}>
            <Intro title="ra">
                <p>
                    Sol-profiler gathers line-by-line gas usage for any transaction submitted through your provider.
                    This will help you find unexpected inefficiencies in parts of your smart contract, and take a
                    data-driven approach to optimizing it.
                </p>
            </Intro>
            <Content>
                <ContentBlock main title="Get started" />
                <ContentBlock title="Required steps">
                    <List items={['Step 1', 'Step 2']} />
                </ContentBlock>
                <ContentBlock title="Prerequisites">
                    <Code>npm install @0x/sol-trace --save</Code>
                    <p>
                        Sol-trace is a subprovider that needs to be prepended to your <a href="#">provider engine</a>.
                        Depending on your project setup, you will need to use a specific ArtifactAdapter. Sol-trace
                        ships with the <InlineCode>SolCompilerArtifactAdapter</InlineCode> for use with Sol-compiler and{' '}
                        <InlineCode>TruffleArtifactAdapter</InlineCode> for use with the Truffle framework. You can also
                        write your own and support any artifact format.
                    </p>
                </ContentBlock>

                <ContentBlock title="Installation">
                    <Tabs>
                        <TabBlock title="Sol-compiler">
                            <Code language="js">
                                {`import { SolCompilerArtifactAdapter } from '@0x/sol-trace';

// Both artifactsDir and contractsDir are optional and will be fetched from compiler.json if not passed in
const artifactAdapter = new SolCompilerArtifactAdapter(artifactsDir, contractsDir);`}
                            </Code>
                        </TabBlock>
                        <TabBlock title="Truffle">Truffle</TabBlock>
                        <TabBlock title="Custom">Custom</TabBlock>
                    </Tabs>
                </ContentBlock>
            </Content>
        </Base>
    );
}

const root = document.getElementById('app');

if (root.hasChildNodes()) {
    hydrate(<Profiler />, root);
} else {
    render(<Profiler />, root);
}
