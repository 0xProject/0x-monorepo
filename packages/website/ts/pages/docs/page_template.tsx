import * as _ from 'lodash';
import * as React from 'react';
import styled, { keyframes } from 'styled-components';

// import { Tabs } from 'react-tabs';
import { Callout } from 'ts/components/docs/callout';
import { Code } from 'ts/components/docs/code';
import { CommunityLink, CommunityLinkProps } from 'ts/components/docs/community_link';
import { FeatureLink } from 'ts/components/docs/feature_link';
import { HelpCallout } from 'ts/components/docs/help_callout';
import { HelpfulCta } from 'ts/components/docs/helpful_cta';
import { Hero } from 'ts/components/docs/hero';
import { NewsletterSignup } from 'ts/components/docs/newsletter_signup';
import { Note } from 'ts/components/docs/note';
import { Resource } from 'ts/components/docs/resource/resource';
import { LinkProps, ShortcutLink } from 'ts/components/docs/shortcut_link';
import { ChapterLinks } from 'ts/components/docs/sidebar/chapter_links';
import { FilterGroup, Filters } from 'ts/components/docs/sidebar/filters';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { StepLinkConfig } from 'ts/components/docs/step_link';
import { StepLinks } from 'ts/components/docs/step_links';
import { Table } from 'ts/components/docs/table';
import { Tab, TabList, TabPanel, Tabs } from 'ts/components/docs/tabs';
import { TutorialSteps } from 'ts/components/docs/tutorial_steps';
import { UnorderedList } from 'ts/components/docs/unordered_list';
import { DocumentTitle } from 'ts/components/document_title';
import { Section, SectionProps } from 'ts/components/newLayout';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';
import { WebsitePaths } from 'ts/types';
import { documentConstants } from 'ts/utils/document_meta_constants';

interface Props {
    location: Location;
    theme: {
        bgColor: string;
        textColor: string;
        linkColor: string;
    };
}

const usefulLinks: StepLinkConfig[] = [
    {
        title: 'Core Concepts',
        url: '/docs/core-concepts',
    },
    {
        title: 'API Explorer',
        url: '/docs/core-concepts',
    },
    {
        title: 'Guides',
        url: '/docs/get-started',
    },
    {
        title: 'Tools',
        url: '/docs/core-concepts',
    },
];

const filterGroups: FilterGroup[] = [
    {
        heading: 'Topic',
        name: 'topic',
        filters: [
            {
                value: 'Mesh',
                label: 'Mesh',
            },
            {
                value: 'Testing',
                label: 'Testing',
            },
            {
                value: 'Coordinator Model',
                label: 'Coordinator Model',
            },
            {
                value: 'Protocol developer',
                label: 'Protocol developer',
            },
        ],
    },
    {
        heading: 'Level',
        name: 'level',
        filters: [
            {
                value: 'Beginner',
                label: 'Beginner',
            },
            {
                value: 'Intermediate',
                label: 'Intermediate',
            },
            {
                value: 'Advanced',
                label: 'Advanced',
            },
        ],
    },
];

export class DocsPageTemplate extends React.Component<Props> {
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <DocumentTitle {...documentConstants.DOCS} />
                <Hero isHome={false} title={`Page Template`} description="This a subheader for the page" />
                <Section maxWidth={'1030px'} isPadded={false} padding="0 0">
                    <Columns>
                        <aside>
                            <Filters groups={filterGroups} />
                            <ChapterLinks />
                        </aside>
                        <article>
                            <LargeHeading>Large Heading</LargeHeading>
                            <LargeIntro>Larger introduction text</LargeIntro>
                            <Heading asElement="h2" size="default">
                                Notifications
                            </Heading>
                            <Callout text="This is' a pretty standard information callout" />
                            <Callout text="This is an indication that something isn’t quite right" type="alert" />
                            <Callout text="This is a success message" type="success" />
                            <Heading asElement="h2" size="default">
                                Tutorial Steps
                            </Heading>
                            <TutorialSteps>
                                <li>Step 1</li>
                                <li>Step 2</li>
                                <li>Step 3</li>
                            </TutorialSteps>
                            <Heading asElement="h2" size="default">
                                Standard Heading
                            </Heading>
                            <Paragraph>This would be paragraph text.</Paragraph>
                            <Paragraph>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec consequat velit in nisl
                                varius malesuada. Morbi at porttitor enim. Donec vel tristique dolor, quis convallis
                                sapien. Nam et massa tempus, dignissim leo vitae, ultricies libero. Vivamus eu enim
                                tellus. Phasellus eu mattis elit. Proin ut eleifend urna, sed tincidunt nunc. Sed eu
                                dapibus metus, in congue ipsum. Duis volutpat sem et sem faucibus blandit. Nullam
                                ultricies ante eu elit auctor, id mattis nunc euismod. Curabitur arcu enim, cursus ac
                                pellentesque quis, accumsan sit amet turpis. Praesent dignissim mi a maximus euismod
                            </Paragraph>
                            <Paragraph>And here is a table:</Paragraph>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Parameter</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>makerAddress</td>
                                        <td>
                                            Address that created the order. The maker is one of the two parties that
                                            will be involved in the trade if the order gets filled.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>takerAddress</td>
                                        <td>
                                            Address that is allowed to fill the order. If set to 0, anyone is allowed to
                                            fill the order. This field allows makers to decide who can fill an order,
                                            rendering it useless to eavesdroppers or outside parties.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>feeRecipientAddress</td>
                                        <td>
                                            The address that will receive the fees stipulated by the order. This is
                                            typically used to incentivize off-chain order relay.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>senderAddress</td>
                                        <td>
                                            Is an advanced feature that can be defaulted to the 0 address. It allows the
                                            maker to enforce that the order must flow through some additional logic
                                            residing in an additional Ethereum smart contract before it can be filled
                                            (e.g a KYC whitelist contract) -- more on "extension contracts" later.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>makerAssetAmount</td>
                                        <td>
                                            Amount of the maker'sAsset being offered by the maker. Must be greater than
                                            0.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>makerFee</td>
                                        <td>
                                            The fee to be paid by the order maker to the{' '}
                                            <code>feeRecipientAddress</code> in the event of an order fill. Partial
                                            fills result in partial fees.
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                            <H3>Code Snippet</H3>
                            <Code>
                                {`import { provider, networkId, signerAddress, salt, signature, senderAddress } from '@0x/browser-examples';

const exchange = new ExchangeContract(provider, networkId);

const txnReceipt = await exchange.executeTransaction.awaitTransactionSuccessAsync(salt, signerAddress, data, signature, {
    from: senderAddress,
});`}
                            </Code>
                            <H3>Tabbed Code Snippet</H3>
                            <Tabs>
                                <TabList>
                                    <Tab>Typescript</Tab>
                                    <Tab>Python</Tab>
                                    <Tab>Solidity</Tab>
                                </TabList>

                                <TabPanel>
                                    <Code>
                                        {`import { provider, networkId, signerAddress, salt, signature, senderAddress } from '@0x/browser-examples';

const exchange = new ExchangeContract(provider, networkId);

const txnReceipt = await exchange.executeTransaction.awaitTransactionSuccessAsync(salt, signerAddress, data, signature, {
    from: senderAddress,
});`}
                                    </Code>
                                </TabPanel>
                                <TabPanel>
                                    <Code>
                                        {`import { provider, networkId, signerAddress, salt, signature, senderAddress } from '@0x/browser-examples';

const exchange = new ExchangeContract(provider, networkId);

const txnReceipt = await exchange.executeTransaction.awaitTransactionSuccessAsync(salt, signerAddress, data, signature, {
    from: senderAddress,
});`}
                                    </Code>
                                </TabPanel>
                                <TabPanel>
                                    <Code>
                                        {`import { provider, networkId, signerAddress, salt, signature, senderAddress } from '@0x/browser-examples';

const exchange = new ExchangeContract(provider, networkId);

const txnReceipt = await exchange.executeTransaction.awaitTransactionSuccessAsync(salt, signerAddress, data, signature, {
    from: senderAddress,
});`}
                                    </Code>
                                </TabPanel>
                            </Tabs>
                            <H3>Subheading</H3>
                            <Paragraph>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec consequat velit in nisl
                                varius malesuada. Morbi at porttitor enim. Donec vel tristique dolor, quis convallis
                                sapien. Nam et massa tempus, dignissim leo vitae, ultricies libero. Vivamus eu enim
                                tellus. Phasellus eu mattis elit. Proin ut eleifend urna, sed tincidunt nunc. Sed eu
                                dapibus metus, in congue ipsum. Duis volutpat sem et sem faucibus blandit. Nullam
                                ultricies ante eu elit auctor, id mattis nunc euismod. Curabitur arcu enim, cursus ac
                                pellentesque quis, accumsan sit amet turpis. Praesent dignissim mi a maximus euismod
                            </Paragraph>
                            <div>
                                <Note
                                    heading="Information"
                                    description="This is a side-info callout used to explain things a little more when needed."
                                />
                                <Paragraph>
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec consequat velit in
                                    nisl varius malesuada. Morbi at porttitor enim. Donec vel tristique dolor, quis
                                    convallis sapien. Nam et massa tempus, dignissim leo vitae, ultricies libero.
                                    Vivamus eu enim tellus. Phasellus eu mattis elit. Proin ut eleifend urna, sed
                                    tincidunt nunc. Sed eu dapibus metus, in congue ipsum. Duis volutpat sem et sem
                                    faucibus blandit. Nullam ultricies ante eu elit auctor, id mattis nunc euismod.
                                    Curabitur arcu enim, cursus ac pellentesque quis, accumsan sit amet turpis. Praesent
                                    dignissim mi a maximus euismod
                                </Paragraph>
                            </div>
                            <UnorderedList>
                                <li>List items</li>
                                <li>List items</li>
                                <li>List items</li>
                                <li>List items</li>
                            </UnorderedList>
                            <Heading asElement="h2" size="default">
                                Tabbed Code Snippet
                            </Heading>
                            <Heading asElement="h2" size="default">
                                Run Code Snippet
                            </Heading>
                            <Heading asElement="h2" size="default">
                                Next Steps
                            </Heading>
                            <StepLinks links={usefulLinks} />
                            <HelpCallout />
                            <NewsletterSignup />
                            <HelpfulCta />
                            <div>
                                <Heading asElement="h2" size="default">
                                    Resources
                                </Heading>
                                <Resource
                                    heading="RadarRelay SDK"
                                    description="The Radar Relay SDK is a software development kit that simplifies the interactions with Radar Relay’s APIs"
                                    tags={[{ label: 'Relayer' }]}
                                    url="/docs"
                                />
                                <Resource
                                    heading="RadarRelay SDK"
                                    description="The Radar Relay SDK is a software development kit that simplifies the interactions with Radar Relay’s APIs"
                                    tags={[{ label: 'Community Maintained', isInverted: true }, { label: 'Relayer' }]}
                                    url="/docs"
                                />
                            </div>
                            <div>
                                <Heading asElement="h2" size="default">
                                    Feature Links
                                </Heading>
                                <FeatureLink
                                    heading="RadarRelay SDK"
                                    description="A description could possibly go here but could be tight."
                                    icon="flexibleIntegration"
                                    url="#"
                                />
                                <FeatureLink
                                    heading="RadarRelay SDK"
                                    description="A description could possibly go here but could be tight."
                                    icon="flexibleIntegration"
                                    url="#"
                                />
                                <FeatureLink
                                    heading="RadarRelay SDK"
                                    description="A description could possibly go here but could be tight."
                                    icon="flexibleIntegration"
                                    url="#"
                                />
                            </div>
                        </article>
                    </Columns>
                </Section>
            </SiteWrap>
        );
    }
}

const Columns = styled.div<{ count?: number }>`
    display: grid;
    grid-template-columns: 230px 1fr;
    grid-column-gap: 118px;
    grid-row-gap: 30px;
`;

Columns.defaultProps = {
    count: 2,
};

const Separator = styled.hr`
    border-width: 0 0 1px;
    border-color: #e4e4e4;
    height: 0;
    margin-top: 60px;
    margin-bottom: 60px;
`;

const LargeHeading = styled(Heading).attrs({
    asElement: 'h1',
})`
    font-size: 2.125rem !important;
`;

const LargeIntro = styled(Paragraph).attrs({
    size: 'medium',
})``;

const H2 = styled(Heading).attrs({
    size: 'default',
    asElement: 'h2',
})``;

const H3 = styled(Heading).attrs({
    size: 'default',
    asElement: 'h3',
})``;
