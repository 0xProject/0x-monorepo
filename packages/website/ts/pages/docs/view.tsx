import React, { useEffect, useState } from 'react';
import { match } from 'react-router-dom';
import styled from 'styled-components';

import { utils } from '@0x/react-shared';
import capitalize from 'lodash/capitalize';

import { MDXProvider } from '@mdx-js/react';

import CircularProgress from 'material-ui/CircularProgress';

import { Code } from 'ts/components/docs/code';
import { CodeTabs } from 'ts/components/docs/code_tabs';
import { HelpCallout } from 'ts/components/docs/help_callout';
import { HelpfulCta } from 'ts/components/docs/helpful_cta';
import { Hero } from 'ts/components/docs/hero';
import { InlineCode } from 'ts/components/docs/inline_code';
import { InlineLink } from 'ts/components/docs/inline_link';
import { Notification } from 'ts/components/docs/notification';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { Table } from 'ts/components/docs/table';
import { TutorialSteps } from 'ts/components/docs/tutorial_steps';
import { UnorderedList } from 'ts/components/docs/unordered_list';
import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';
import { Heading, Paragraph } from 'ts/components/text';

import { documentConstants } from 'ts/utils/document_meta_constants';

import { colors } from 'ts/style/colors';

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
    Component: React.ReactNode;
}

export const DocsView: React.FC<IDocsViewProps> = props => {
    const [state, setState] = useState<IDocsViewState>({
        Component: null,
    });

    const { Component } = state;

    const { page } = props.match.params;
    const title = capitalize(utils.convertDashesToSpaces(page));

    useEffect(() => {
        void loadPageAsync(page);
    }, [page]);

    const loadPageAsync = async (fileName: string) => {
        const component = await import(`../../../md/new-docs/${fileName}.mdx`);

        if (component) {
            console.log('component', component);
            console.log('component.tableOfContents()', component.tableOfContents());
            setState({
                // title: component.meta.title,
                Component: component.default,
            });
        }
        // @TODO: add error handling, loading
    };

    return (
        <SiteWrap theme="light">
            <DocumentTitle {...documentConstants.DOCS} />
            <Hero title={title} />
            <Section maxWidth="1030px" isPadded={false}>
                {Component ? (
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
                            <HelpCallout />
                            <HelpfulCta page={page} />
                        </ContentWrapper>
                    </Columns>
                ) : (
                    <LoaderWrapper>
                        <CircularProgress size={40} thickness={5} color={colors.brandLight} />
                    </LoaderWrapper>
                )}
            </Section>
        </SiteWrap>
    );
};

const LoaderWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
`;

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
    code: Code,
    h1: LargeHeading,
    h2: H2,
    h3: H3,
    hr: Separator,
    inlineCode: InlineCode,
    a: InlineLink,
    ol: TutorialSteps,
    p: Paragraph,
    table: Table,
    ul: UnorderedList,
    Notification,
    CodeTabs,
};
