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
import { NewsletterWidget } from 'ts/components/docs/mdx/newsletter_widget';
import { Notification } from 'ts/components/docs/mdx/notification';
import { OrderedList } from 'ts/components/docs/mdx/ordered_list';
import { Table } from 'ts/components/docs/mdx/table';
import { UnorderedList } from 'ts/components/docs/mdx/unordered_list';

import { Columns } from 'ts/components/docs/layout/columns';
import { ContentWrapper } from 'ts/components/docs/layout/content_wrapper';
import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';

import { Separator } from 'ts/components/docs/separator';
import { IContents, TableOfContents } from 'ts/components/docs/sidebar/table_of_contents';

import { FullscreenMessage } from 'ts/pages/fullscreen_message';

import { Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';

interface IDocsPageProps {
    match: match<any>;
}

interface IDocsPageState {
    Component: React.ReactNode;
    contents: IContents[];
    title: string;
    subtitle: string;
    wasNotFound: boolean;
}

export const DocsPage: React.FC<IDocsPageProps> = ({ match }) => {
    const [state, setState] = useState<IDocsPageState>({
        Component: null,
        contents: [],
        title: '',
        subtitle: '',
        wasNotFound: false,
    });

    const { Component, contents, title, subtitle, wasNotFound } = state;
    const isLoading = !Component && !wasNotFound;
    const { page, type } = match.params;

    useEffect(
        () => {
            void loadPageAsync(page, type);
        },
        [page, type],
    );

    const loadPageAsync = async (fileName: string, dirName: string) => {
        try {
            const component = await import(`../../../mdx/${dirName}/${fileName}.mdx`);

            setState({
                ...state,
                Component: component.default,
                contents: component.tableOfContents(),
                title: component.meta.title,
            });
        } catch (error) {
            setState({ ...state, title: '404', wasNotFound: true });
        }
    };

    return (
        <DocsPageLayout title={title} subtitle={subtitle} loading={isLoading}>
            {wasNotFound ? (
                <FullscreenMessage
                    headerText={'Not found'}
                    headerTextColor={colors.brandDark}
                    bodyText={"Hm... looks like we couldn't find what you are looking for."}
                />
            ) : (
                <Columns>
                    <TableOfContents contents={contents} />
                    <Separator />
                    <ContentWrapper>
                        <MDXProvider components={mdxComponents}>
                            {/*
                                // @ts-ignore */}
                            <Component />
                        </MDXProvider>
                        <NewsletterWidget />
                        <HelpCallout />
                        <HelpfulCta page={page} />
                    </ContentWrapper>
                </Columns>
            )}
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
