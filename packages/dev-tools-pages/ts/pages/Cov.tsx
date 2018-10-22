import * as React from 'react';
import { render, hydrate } from 'react-dom';

import context from 'ts/context/cov';
import Base from 'ts/components/Base';
import Main from 'ts/components/Main';
import ContentBlock from 'ts/components/ContentBlock';
import { Tabs, TabBlock } from 'ts/components/Tabs';
import Code from 'ts/components/Code';
import InlineCode from 'ts/components/InlineCode';
import List from 'ts/components/List';
import Intro from 'ts/components/Intro';

function Cov() {
    return (
        <Base context={context}>
            <Intro title="Measure your tests">
                <p>
                    When it comes to writing smart contracts, testing is one of the most important steps of the process.
                    In order to quantify the robustness of your Solidity testing suite, you need to measure its code
                    coverage.
                </p>
            </Intro>
            <Main>
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
            </Main>
        </Base>
    );
}

const root = document.getElementById('app');

if (root.hasChildNodes()) {
    hydrate(<Cov />, root);
} else {
    render(<Cov />, root);
}
