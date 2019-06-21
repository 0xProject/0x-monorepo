import { utils as sharedUtils } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import styled, { keyframes } from 'styled-components';

import { Callout } from 'ts/components/docs/callout';
import { CommunityLink, CommunityLinkProps } from 'ts/components/docs/community_link';
import { Hero } from 'ts/components/docs/hero';
import { SearchInput } from 'ts/components/docs/search_input';
import { LinkProps, ShortcutLink } from 'ts/components/docs/shortcut_link';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { StepLinkConfig } from 'ts/components/docs/step_link';
import { StepLinks } from 'ts/components/docs/step_links';
import { TutorialSteps } from 'ts/components/docs/tutorial_steps';
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

export class DocsPageTemplate extends React.Component<Props> {
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <DocumentTitle {...documentConstants.DOCS} />
                <Hero isHome={false} title={`Page Template`} description="This a subheader for the page" />
                <Section maxWidth={'1150px'} isPadded={false} padding="0 0">
                    <Columns>
                        <aside>
                            <Paragraph>Sidebar</Paragraph>
                        </aside>
                        <article>
                            <LargeHeading>Large Heading</LargeHeading>
                            <LargeIntro>Large Heading</LargeIntro>
                            <Heading asElement="h2" size="default">Notifications</Heading>
                            <Callout text="This is' a pretty standard information callout" />
                            <Callout text="This is an indication that something isn’t quite right" type="alert" />
                            <Callout text="This is a success message" type="success" />
                            <Heading asElement="h2" size="default">Tutorial Steps</Heading>
                            <TutorialSteps>
                                <li>Step 1</li>
                                <li>Step 2</li>
                                <li>Step 3</li>
                            </TutorialSteps>
                            <Heading asElement="h2" size="default">Standard Heading</Heading>
                            <Paragraph>
                                This would be paragraph text.
                            </Paragraph>
                            <Paragraph>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec consequat velit in nisl varius malesuada. Morbi at porttitor enim. Donec vel tristique dolor, quis convallis sapien. Nam et massa tempus, dignissim leo vitae, ultricies libero. Vivamus eu enim tellus. Phasellus eu mattis elit. Proin ut eleifend urna, sed tincidunt nunc. Sed eu dapibus metus, in congue ipsum. Duis volutpat sem et sem faucibus blandit. Nullam ultricies ante eu elit auctor, id mattis nunc euismod. Curabitur arcu enim, cursus ac pellentesque quis, accumsan sit amet turpis. Praesent dignissim mi a maximus euismod
                            </Paragraph>
                            <Paragraph>
                                And here is a table:
                            </Paragraph>
                            <Heading asElement="h3" size="default">Subheading</Heading>
                            <Paragraph>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec consequat velit in nisl varius malesuada. Morbi at porttitor enim. Donec vel tristique dolor, quis convallis sapien. Nam et massa tempus, dignissim leo vitae, ultricies libero. Vivamus eu enim tellus. Phasellus eu mattis elit. Proin ut eleifend urna, sed tincidunt nunc. Sed eu dapibus metus, in congue ipsum. Duis volutpat sem et sem faucibus blandit. Nullam ultricies ante eu elit auctor, id mattis nunc euismod. Curabitur arcu enim, cursus ac pellentesque quis, accumsan sit amet turpis. Praesent dignissim mi a maximus euismod
                            </Paragraph>
                            <ul>
                                <li>List items</li>
                                <li>List items</li>
                                <li>List items</li>
                                <li>List items</li>
                            </ul>
                            <Heading asElement="h2" size="default">Tabbed Code Snippet</Heading>
                            <Heading asElement="h2" size="default">Run Code Snippet</Heading>
                            <Heading asElement="h2" size="default">Next Steps</Heading>
                            <StepLinks links={usefulLinks} />
                        </article>
                    </Columns>
                </Section>
            </SiteWrap>
        );
    }
}

const Columns = styled.div<{ count?: number }>`
    display: grid;
    grid-template-columns: 314px 1fr;
    grid-column-gap: 40px;
    grid-row-gap: 30px;
`;

Columns.defaultProps = {
    count: 2,
};

const Separator = styled.hr`
    border-width: 0 0 1px;
    border-color: #E4E4E4;
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
})`
`;
