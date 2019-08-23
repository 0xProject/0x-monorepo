import * as React from 'react';
import { hydrate, render } from 'react-dom';
import * as Loadable from 'react-loadable';

import { context } from 'ts/context/trace';

import { Base } from 'ts/components/base';
import { Breakout } from 'ts/components/breakout';
import { CallToAction } from 'ts/components/call_to_action';
import { Code } from 'ts/components/code';
import { Content } from 'ts/components/content';
import { ContentBlock } from 'ts/components/content-block';
import { Hero } from 'ts/components/hero';
import { InlineCode } from 'ts/components/inline-code';
import { List, ListItem } from 'ts/components/list';
import { TabBlock, Tabs } from 'ts/components/tabs';
import { Trace as TraceComponent } from 'ts/components/trace';

const Animation = Loadable({
    loader: () => System.import(/* webpackChunkName: 'trace-animation' */ 'ts/components/animations/trace'),
    loading: () => <div />,
    delay: 1000,
    render(loadable: { TraceAnimation: any }): React.ReactNode {
        const Component = loadable.TraceAnimation;
        return <Component />;
    },
});

const Trace: React.StatelessComponent<{}> = () => (
    <Base context={context}>
        <Hero>
            <Animation />
        </Hero>
        <TraceComponent />
        <Content>
            <ContentBlock main={true} title="Get started" />
            <ContentBlock title="Prerequisites">
                <List>
                    <ListItem>
                        Use{' '}
                        <a href="https://github.com/trufflesuite/ganache-cli" target="_blank">
                            Ganache
                        </a>{' '}
                        as a backing node.
                    </ListItem>
                    <ListItem>
                        Understand and use{' '}
                        <a href="https://github.com/MetaMask/provider-engine" target="_blank">
                            web3-provider-engine
                        </a>
                        .
                    </ListItem>
                </List>
            </ContentBlock>
            <ContentBlock title="Installation">
                <Breakout>
                    <Code canCopy={true}>npm install @0x/sol-trace --save</Code>
                </Breakout>

                <p>
                    Sol-trace is a subprovider that needs to be prepended to your{' '}
                    <a href="https://github.com/MetaMask/provider-engine" target="_blank">
                        provider engine
                    </a>
                    . Depending on your project setup, you will need to use a specific ArtifactAdapter. Sol-trace ships
                    with the <InlineCode>SolCompilerArtifactAdapter</InlineCode> for use with{' '}
                    <a href="https://sol-compiler.com" target="_blank">
                        Sol-compiler
                    </a>{' '}
                    and <InlineCode>TruffleArtifactAdapter</InlineCode> for use with the{' '}
                    <a href="https://truffleframework.com/truffle" target="_blank">
                        Truffle framework
                    </a>{' '}
                    (Also see our{' '}
                    <a href="https://github.com/0xProject/dev-tools-truffle-example" target="_blank">
                        Truffle example project
                    </a>{' '}
                    for a complete walk-through). You can also write your own and support any artifact format.
                </p>

                <Tabs>
                    <TabBlock title="Sol-compiler">
                        <Code language="javascript" canCopy={true}>
                            {`import { SolCompilerArtifactAdapter } from '@0x/sol-trace';

// Both artifactsDir and contractsDir are optional and will be fetched from compiler.json if not passed in
const artifactAdapter = new SolCompilerArtifactAdapter(artifactsDir, contractsDir);`}
                        </Code>
                    </TabBlock>
                    <TabBlock title="Truffle">
                        <Code language="javascript" canCopy={true}>
                            {`import { TruffleArtifactAdapter } from '@0x/sol-trace';

const projectRoot = '.';
const solcVersion = '0.5.0';
const artifactAdapter = new TruffleArtifactAdapter(projectRoot, solcVersion);`}
                        </Code>
                    </TabBlock>
                    <TabBlock title="Custom">
                        <Code language="javascript" canCopy={true}>
                            {`import { AbstractArtifactAdapter } from '@0x/sol-trace';

class YourCustomArtifactsAdapter extends AbstractArtifactAdapter {...};
const artifactAdapter = new YourCustomArtifactsAdapter(...);`}
                        </Code>
                    </TabBlock>
                </Tabs>
                <p>
                    Now that we have an <InlineCode>artifactAdapter</InlineCode>, we can create a{' '}
                    <InlineCode>revertTraceSubprovider</InlineCode> and append it to our provider engine.
                </p>

                <Breakout>
                    <Code language="javascript" canCopy={true}>
                        {`import ProviderEngine from 'web3-provider-engine';
import WebsocketSubprovider from 'web3-provider-engine/subproviders/websocket';
import { RevertTraceSubprovider } from '@0x/sol-trace';

const defaultFromAddress = "..."; // Some ethereum address with test funds
const revertTraceSubprovider = new RevertTraceSubprovider(artifactAdapter, defaultFromAddress);

const providerEngine = new ProviderEngine();
providerEngine.addProvider(revertTraceSubprovider);
providerEngine.addProvider(new WebsocketSubprovider({rpcUrl: 'http://localhost:8545'}));
providerEngine.start();`}
                    </Code>
                </Breakout>
                <p>Stack traces will now be printed whenever your contracts revert!</p>
            </ContentBlock>
        </Content>
        <CallToAction />
    </Base>
);

const root = document.getElementById('app');

if (root.hasChildNodes()) {
    hydrate(<Trace />, root);
} else {
    render(<Trace />, root);
}
