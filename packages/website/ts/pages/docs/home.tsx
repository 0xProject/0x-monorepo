import * as React from 'react';

import { CommunityLinks } from 'ts/components/docs/home/community_links';
import { MiddleSection } from 'ts/components/docs/home/middle_section';
import { ShortcutLinks } from 'ts/components/docs/home/shortcut_links';

import { Separator } from 'ts/components/docs/shared/separator';

import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';

import { constants } from 'ts/utils/constants';

import { WebsitePaths } from 'ts/types';

const SEPARATOR_MARGIN = '60px 0';

export const DocsHome: React.FC = () => {
    return (
        <DocsPageLayout isHome={true} title="0x Docs">
            <ShortcutLinks links={shortcutLinks} />
            <Separator margin={SEPARATOR_MARGIN} />
            <MiddleSection getStartedLinks={getStartedLinks} usefulLinks={usefulLinks} />
            <Separator margin={SEPARATOR_MARGIN} />
            <CommunityLinks links={communityLinks} />
        </DocsPageLayout>
    );
};

const shortcutLinks = [
    {
        heading: 'Core Concepts',
        description: "Learn all the core concepts you'll need to build effectively on 0x",
        icon: 'coreConcepts',
        url: WebsitePaths.DocsCoreConcepts,
    },
    {
        heading: 'API Explorer',
        description: 'Explore the core 0x library and learn how to use it',
        icon: 'apiExplorer',
        url: WebsitePaths.DocsApiExplorer,
    },
    {
        heading: 'Guides',
        description: 'Dive into beginner, intermediate and advanced 0x development topics',
        icon: 'getStarted',
        url: WebsitePaths.DocsGuides,
    },
    {
        heading: 'Tools',
        description: 'Browse and filter through all the open-source 0x developer tools',
        icon: 'tools',
        url: WebsitePaths.DocsTools,
    },
];

const usefulLinks = [
    {
        title: '0x Cheat Sheet',
        url: `${WebsitePaths.Docs}/guides/0x-cheat-sheet`,
    },
    {
        title: 'Code Sandbox',
        url: constants.URL_SANDBOX,
    },
    {
        title: 'ZEIPs: 0x Improvement Proposals',
        url: constants.URL_ZEIP_REPO,
    },
    {
        title: 'Relayer Registry',
        url: constants.URL_RELAYER_REGISTRY,
    },
];

const getStartedLinks = [
    {
        heading: 'Launch an exchange in a few minutes',
        description: 'Learn how to spin up an exchange or marketplace in seconds.',
        href: constants.URL_LAUNCH_KIT_TUTORIAL_YOUTUBE,
        target: '_blank',
    },
    {
        heading: 'Tap into contract-fillable liquidity',
        description: 'Source contract-fillable liquidity at the best prices from 0x.',
        url: `${WebsitePaths.DocsGuides}/contract-fillable-liquidity`,
    },
    {
        heading: 'Start market-making on 0x',
        description: 'A primer on how to market-make successfully on 0x.',
        url: `${WebsitePaths.DocsGuides}/market-making-on-0x`,
    },
    {
        heading: 'Add 0x Instant to your website / mobile app',
        description: 'Add a free and simple crypto purchasing flow to your website or mobile app.',
        url: `${WebsitePaths.DocsGuides}/integrate-instant`,
    },
];

const communityLinks = [
    {
        heading: 'Discord',
        description: 'Chat with the 0x community',
        icon: 'chat',
        url: constants.URL_ZEROEX_CHAT,
    },
    {
        heading: 'Forum',
        description: 'Nerd out with 0x researchers',
        icon: 'forum',
        url: constants.URL_FORUM,
    },
    {
        heading: 'GitHub',
        description: 'Contribute to development',
        icon: 'github',
        url: constants.URL_GITHUB_ORG,
    },
];
