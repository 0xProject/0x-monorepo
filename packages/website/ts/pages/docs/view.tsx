import React, { useEffect, useState } from 'react';
import { match } from 'react-router-dom';

import { MDXProvider } from '@mdx-js/react';

import { Code } from 'ts/components/docs/mdx/code';
import { CodeTabs } from 'ts/components/docs/mdx/code_tabs';
import { H1, H2, H3, H4 } from 'ts/components/docs/mdx/headings';
import { HelpCallout } from 'ts/components/docs/mdx/help_callout';
import { HelpfulCta } from 'ts/components/docs/mdx/helpful_cta';
import { InlineCode } from 'ts/components/docs/mdx/inline_code';
import { InlineLink } from 'ts/components/docs/mdx/inline_link';
import { Notification } from 'ts/components/docs/mdx/notification';
import { OrderedList } from 'ts/components/docs/mdx/ordered_list';
import { Table } from 'ts/components/docs/mdx/table';
import { UnorderedList } from 'ts/components/docs/mdx/unordered_list';

import { Columns } from 'ts/components/docs/layout/columns';
import { ContentWrapper } from 'ts/components/docs/layout/content_wrapper';
import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';

import { Separator } from 'ts/components/docs/separator';
import { IContents, TableOfContents } from 'ts/components/docs/sidebar/table_of_contents';

import { Paragraph } from 'ts/components/text';

interface IDocsViewProps {
    match: match<any>;
}

interface IDocsViewState {
    Component: React.ReactNode;
    contents: IContents[];
    title: string;
}

export const DocsView: React.FC<IDocsViewProps> = props => {
    const [state, setState] = useState<IDocsViewState>({
        Component: null,
        contents: [],
        title: '',
    });

    const { Component, contents, title } = state;
    const { page } = props.match.params;

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
                title: component.meta.title,
            });
        }
    };

    return (
        <DocsPageLayout title={title} loading={!Component}>
            <Columns>
                <TableOfContents contents={contents} />
                <Separator />
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
        </DocsPageLayout>
    );
};

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
