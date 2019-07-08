import React, { useEffect, useState } from 'react';
import { match } from 'react-router-dom';
import styled from 'styled-components';

import { MDXProvider } from '@mdx-js/react';

import CircularProgress from 'material-ui/CircularProgress';

import { Code } from 'ts/components/docs/code';
import { HelpCallout } from 'ts/components/docs/help_callout';
import { HelpfulCta } from 'ts/components/docs/helpful_cta';
import { Hero } from 'ts/components/docs/hero';
import { Notification } from 'ts/components/docs/notification';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { Table } from 'ts/components/docs/table';
import { Tab, TabList, TabPanel, Tabs } from 'ts/components/docs/tabs';
import { TutorialSteps } from 'ts/components/docs/tutorial_steps';
import { UnorderedList } from 'ts/components/docs/unordered_list';
import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';
import { Heading, Paragraph } from 'ts/components/text';

import { documentConstants } from 'ts/utils/document_meta_constants';

interface IDocsViewProps {
    history: History;
    location: Location;
    match: match<any>;
    theme: {
        bgColor: string;
        textColor: string;
        linkColor: string;
    };
}

interface IDocsViewState {
    title: string;
    Component: React.ReactNode;
}

const Loader = () => <CircularProgress size={80} thickness={5} />;

export const DocsView: React.FC<IDocsViewProps> = props => {
    const [state, setState] = useState<IDocsViewState>({
        title: 'Loading...',
        Component: Loader,
    });

    const { title, Component } = state;
    const { page } = props.match.params;

    console.log('props', props);

    useEffect(() => {
        // tslint:disable-next-line: no-console
        console.log(page);
        void loadPageAsync(page);
    }, [page]);

    const loadPageAsync = async (fileName: string) => {
        const component = await import(`../../../md/new-docs/${fileName}.mdx`);
        if (component) {
            setState({
                title: component.meta.title,
                Component: component.default,
            });
        }
        // @TODO: add error handling, loading
    };

    return (
        <SiteWrap theme="light">
            <DocumentTitle {...documentConstants.DOCS} />
            <Hero isHome={false} title={title} />
            <Section maxWidth="1030px" isPadded={false} padding="0 0">
                <Columns>
                    <aside>
                        <h3>Sidebar</h3>
                    </aside>
                    <ContentWrapper>
                        <MDXProvider components={mdxComponents}>
                            {/*
                                // @ts-ignore */}
                            <Component />
                        </MDXProvider>
                        {/* <HelpCallout />
                        <HelpfulCta /> */}
                    </ContentWrapper>
                </Columns>
            </Section>
        </SiteWrap>
    );
};

const Columns = styled.div`
    display: grid;
    grid-template-columns: 230px 1fr;
    grid-column-gap: 118px;
    grid-row-gap: 30px;
`;

const ContentWrapper = styled.article`
    min-height: 300px;
`;

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
    margin-bottom: 1.875rem;
`;

const H2 = styled(Heading).attrs({
    size: 'default',
    asElement: 'h2',
})``;

const H3 = styled(Heading).attrs({
    size: 'default',
    asElement: 'h3',
})``;

const mdxComponents = {
    p: Paragraph,
    h1: LargeHeading,
    h2: H2,
    h3: H3,
    ol: TutorialSteps,
    ul: UnorderedList,
    code: Code,
    table: Table,
    hr: Separator,
    Notification,
    Tabs,
    TabList,
    Tab,
    TabPanel,
};
