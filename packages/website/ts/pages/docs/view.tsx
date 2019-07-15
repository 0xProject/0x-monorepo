import React, { useEffect, useState } from 'react';
import { match } from 'react-router-dom';
import styled from 'styled-components';

import { utils } from '@0x/react-shared';
import capitalize from 'lodash/capitalize';

import { MDXProvider } from '@mdx-js/react';

import CircularProgress from 'material-ui/CircularProgress';

import { Code } from 'ts/components/docs/code';
import { CodeTabs } from 'ts/components/docs/code_tabs';
import { H1, H2, H3, H4 } from 'ts/components/docs/headings';
import { HelpCallout } from 'ts/components/docs/help_callout';
import { HelpfulCta } from 'ts/components/docs/helpful_cta';
import { Hero } from 'ts/components/docs/hero';
import { InlineCode } from 'ts/components/docs/inline_code';
import { InlineLink } from 'ts/components/docs/inline_link';
import { Notification } from 'ts/components/docs/notification';
import { OrderedList } from 'ts/components/docs/ordered_list';
import { IContents, TableOfContents } from 'ts/components/docs/sidebar/table_of_contents';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { Table } from 'ts/components/docs/table';
import { UnorderedList } from 'ts/components/docs/unordered_list';
import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';
import { Paragraph } from 'ts/components/text';

import { documentConstants } from 'ts/utils/document_meta_constants';

import { colors } from 'ts/style/colors';

interface IDocsViewProps {
    match: match<any>;
}

interface IDocsViewState {
    Component: React.ReactNode;
    contents: IContents[];
}

export const DocsView: React.FC<IDocsViewProps> = props => {
    const [state, setState] = useState<IDocsViewState>({
        Component: null,
        contents: [],
    });

    const { Component, contents } = state;

    const { page } = props.match.params;
    const title = capitalize(utils.convertDashesToSpaces(page));

    useEffect(
        () => {
            void loadPageAsync(page);
        },
        [page],
    );

    const loadPageAsync = async (fileName: string) => {
        const component = await import(`../../../md/new-docs/${fileName}.mdx`);

        if (component) {
            setState({
                Component: component.default,
                contents: component.tableOfContents(),
            });
        }
        // @TODO: add error handling if needed
    };

    return (
        <SiteWrap theme="light">
            <DocumentTitle {...documentConstants.DOCS} />
            <Hero title={title} />
            {Component ? (
                <Columns>
                    <DocsViewWrapper>
                        <TableOfContents contents={contents} />
                    </DocsViewWrapper>
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
                    <CircularProgress size={40} thickness={2} color={colors.brandLight} />
                </LoaderWrapper>
            )}
        </SiteWrap>
    );
};

const DocsViewWrapper = styled.div`
    position: relative;
`;

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

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
        grid-column-gap: 0;
    }
`;

const ContentWrapper = styled.article`
    min-height: 300px;
    max-width: 100vw;
    width: 100%;
`;

const Separator = styled.hr`
    border-width: 0 0 1px;
    border-color: #e4e4e4;
    height: 0;
    margin-top: 60px;
    margin-bottom: 60px;
`;

const mdxComponents = {
    code: Code,
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    hr: Separator,
    inlineCode: InlineCode,
    a: InlineLink,
    ol: OrderedList,
    p: Paragraph,
    table: Table,
    ul: UnorderedList,
    Notification,
    CodeTabs,
};
