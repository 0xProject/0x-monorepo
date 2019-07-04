import * as _ from 'lodash';
import * as React from 'react';
import styled, { keyframes } from 'styled-components';

// import { Tabs } from 'react-tabs';
import { Notification } from 'ts/components/docs/notification';
import { Code } from 'ts/components/docs/code';
import { CommunityLink, CommunityLinkProps } from 'ts/components/docs/community_link';
import { FeatureLink } from 'ts/components/docs/feature_link';
import { HelpCallout } from 'ts/components/docs/help_callout';
import { HelpfulCta } from 'ts/components/docs/helpful_cta';
import { Hero } from 'ts/components/docs/hero';
import { NewsletterSignup } from 'ts/components/docs/newsletter_signup';
import { Note } from 'ts/components/docs/note';
import { Resource } from 'ts/components/docs/resource/resource';
import { SearchInput } from 'ts/components/docs/search_input';
import { LinkProps, ShortcutLink } from 'ts/components/docs/shortcut_link';
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

export class DocsGuides extends React.Component<Props> {
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <DocumentTitle {...documentConstants.DOCS} />
                <Hero isHome={false} title={`Guides`} />
                <Section maxWidth={'1030px'} isPadded={false} padding="0 0">
                    <Columns>
                        <aside>
                            <Filters groups={filterGroups} />
                        </aside>
                        <article>
                            <div>
                                <Resource
                                    heading="0x Mesh - your gateway to networked liquidity"
                                    description="The Radar Relay SDK is a software development kit that simplifies the interactions with Radar Relay’s APIs"
                                    tags={[{ label: 'Relayer' }]}
                                    url="/docs/guides/usage"
                                />
                                <Resource
                                    heading="0x Mesh - your gateway to networked liquidity"
                                    description="Learn about the 0x peer-to-peer network for sharing orders and how you can use it to tap into networked liquidity."
                                    tags={[{ label: 'Relayer' }]}
                                    url="/docs/guides/usage"
                                />
                                <Resource
                                    heading="0x Mesh - your gateway to networked liquidity"
                                    description="Learn about the 0x peer-to-peer network for sharing orders and how you can use it to tap into networked liquidity."
                                    tags={[{ label: 'Relayer' }]}
                                    url="/docs/guides/usage"
                                />
                                <Resource
                                    heading="0x Mesh - your gateway to networked liquidity"
                                    description="Learn about the 0x peer-to-peer network for sharing orders and how you can use it to tap into networked liquidity."
                                    tags={[{ label: 'Relayer' }]}
                                    url="/docs/guides/usage"
                                />
                                <Resource
                                    heading="0x Mesh - your gateway to networked liquidity"
                                    description="The Radar Relay SDK is a software development kit that simplifies the interactions with Radar Relay’s APIs"
                                    tags={[{ label: 'Community Maintained', isInverted: true }, { label: 'Relayer' }]}
                                    url="/docs/guides/usage"
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
    grid-template-columns: 250px 1fr;
    grid-column-gap: 98px;
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
