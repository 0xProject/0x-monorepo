import * as _ from 'lodash';
import * as React from 'react';
import styled, { keyframes } from 'styled-components';

// import { Tabs } from 'react-tabs';
import { MDXProvider } from '@mdx-js/react';
import { match } from 'react-router-dom';
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
import { Filters } from 'ts/components/docs/sidebar/filters';
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
    history: History;
    location: Location;
    match: match<any>;
    theme: {
        bgColor: string;
        textColor: string;
        linkColor: string;
    };
}

interface State {
    title: string;
    Component: JSX.Element | string;
}

export class DocsView extends React.Component<Props, State> {
    public state = {
        title: '',
        Component: '',
        mdxComponents: {
            p: Paragraph,
            h1: LargeHeading,
            h2: H2,
            h3: H3,
            ol: TutorialSteps,
            ul: UnorderedList,
            code: Code,
            table: Table,
            Callout,
        },
    };
    public componentDidMount(): void {
        // tslint:disable-next-line: no-console
        console.log(this.props.match.params.page);
        this._addComponentAsync(this.props.match.params.page);
    }
    public componentDidUpdate(prevProps: Props, prevState: State): void {
        if (prevProps.match.params.page !== this.props.match.params.page) {
            this._addComponentAsync(this.props.match.params.page);
        }
    }
    public render(): React.ReactNode {
        const { title, Component, mdxComponents } = this.state;
        return (
            <SiteWrap theme="light">
                <DocumentTitle {...documentConstants.DOCS} />
                <Hero isHome={false} title={title} />
                <Section maxWidth={'1030px'} isPadded={false} padding="0 0">
                    <Columns>
                        <aside>
                            <h3>Sidebar</h3>
                        </aside>
                        <ContentWrapper>
                            <MDXProvider components={mdxComponents}>{Component ? <Component /> : null}</MDXProvider>
                            <HelpCallout />
                            <HelpfulCta />
                        </ContentWrapper>
                    </Columns>
                </Section>
            </SiteWrap>
        );
    }
    private async _addComponentAsync(name: string): Promise<void> {
        const component = await import(`../../../md/new-docs/${name}.mdx`).catch(e => {
            return null;
        });
        if (!component) {
            this.setState({
                Component: '',
            });
        }

        this.setState({
            title: component.meta.title,
            Component: component.default,
        });
    }
}

const Columns = styled.div<{ count?: number }>`
    display: grid;
    grid-template-columns: 230px 1fr;
    grid-column-gap: 118px;
    grid-row-gap: 30px;
`;

const ContentWrapper = styled.article`
    min-height: 300px;
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
