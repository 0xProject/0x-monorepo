import * as _ from 'lodash';
import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { MDXProvider } from '@mdx-js/react';

import { Animation } from 'ts/components/docs/mdx/animation';
import { Code } from 'ts/components/docs/mdx/code';
import { CodeTabs } from 'ts/components/docs/mdx/code_tabs';
import { H1, H2, H3, H4, H5, H6 } from 'ts/components/docs/mdx/headings';
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
import { docs } from 'ts/style/docs';

interface IDocsPageProps extends RouteComponentProps<any> {}
interface IDocsPageState {
    Component: React.ReactNode;
    contents: IContents[];
    title: string;
    subtitle: string;
    wasNotFound: boolean;
}

export const DocsPage: React.FC<IDocsPageProps> = props => {
    const [state, setState] = React.useState<IDocsPageState>({
        Component: null,
        contents: [],
        title: '',
        subtitle: '',
        wasNotFound: false,
    });

    const { Component, contents, title, subtitle, wasNotFound } = state;
    const isLoading = !Component && !wasNotFound;
    const { page, type } = props.match.params;
    const { hash } = props.location;

    React.useEffect(() => {
        void loadPageAsync(page, type);
    }, [page, type]);

    const loadPageAsync = async (fileName: string, dirName: string) => {
        try {
            const component = await import(`../../../mdx/${dirName}/${fileName}.mdx`);

            setState({
                ...state,
                Component: component.default,
                contents: component.tableOfContents(),
                subtitle: component.meta.subtitle,
                title: component.meta.title,
            });

            if (hash) {
                await waitForImages(); // images will push down content when loading, so we wait...
                scrollToHash(hash); // ...and then scroll to hash when ready not to push the content down
            }
        } catch (error) {
            setState({ ...state, title: '404', wasNotFound: true });
        }
    };

    const waitForImages = async () => {
        const images = document.querySelectorAll('img');
        return Promise.all(
            _.compact(
                _.map(images, (img: HTMLImageElement) => {
                    if (!img.complete) {
                        return new Promise(resolve => {
                            img.addEventListener('load', () => resolve());
                        });
                    }
                    return false;
                }),
            ),
        );
    };

    const scrollToHash = (hash: string): void => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
            const bodyRect = document.body.getBoundingClientRect();
            const elemRect = element.getBoundingClientRect();
            const elemOffset = elemRect.top - bodyRect.top;
            const totalOffset = elemOffset - docs.headerOffset;
            window.scrollTo(0, totalOffset);
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
    h5: H5,
    h6: H6,
    hr: Separator,
    inlineCode: InlineCode,
    a: InlineLink,
    ol: OrderedList,
    p: Paragraph,
    table: Table,
    ul: UnorderedList,
    Animation,
    CodeTabs,
    Notification,
};
