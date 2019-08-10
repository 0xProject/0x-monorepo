export const meta: { [key: string]: any } = {
    // Api explorer
    'api-explorer': {
        title: '0x API Explorer',
        // @TODO: adjust api explorer meta here
    },
    // Core concepts
    'core-concepts': {
        title: '0x Core Concepts',
        subtitle: "Learn all the core concepts you'll need to build effectively on 0x",
        // description:
        //     '0x is a protocol that facilitates the peer-to-peer exchange of Ethereum-based assets. The protocol serves as an open standard and common building block for any developer needing exchange functionality. 0x provides secure smart contracts that are externally audited; developer tools tailored to the 0x ecosystem; and open access to a pool of shared liquidity. Developers can integrate with 0x at the smart contract or application layer.',
    },
    // Guides
    'build-a-relayer': {
        title: 'Build a relayer',
        description: 'A relayer is any party or entity which hosts an off-chain orderbook.',
        tags: ['Relayer', 'Trader', 'Protocol Developer'],
        topics: ['Coordinator Model', 'Mesh'],
        difficulty: 'Advanced',
    },

    'develop-on-ethereum': {
        title: 'Develop on Ethereum',
        description: 'Welcome to the exciting world of building applications on the Ethereum Blockchain',
        tags: ['Relayer', 'Trader'],
        topics: ['Mesh', 'Protocol Developer'],
        difficulty: 'Beginner',
    },

    'page-template': {
        title: 'Page template',
        description: 'A relayer is any party or entity which hosts an off-chain orderbook.',
        tags: ['Relayer', 'Trader', 'Protocol Developer'],
        topics: ['Coordinator Model', 'Mesh'],
        difficulty: 'Advanced',
    },

    'use-networked-liquidity': {
        title: 'Use networked liquidity',
        description:
            'In this tutorial, we will show you how you can use the @0x/connect package in conjunction with 0x.js in order to',
        tags: ['Protocol Developer'],
        topics: ['Mesh'],
        difficulty: 'Intermediate',
    },
    // Tools
    'asset-buyer': {
        // @TODO: Fix description
        title: 'Asset buyer',
        description: '',
        topics: ['Mesh'],
        difficulty: 'Intermediate',
        isCommunity: true,
        isFeatured: true,
        tags: ['Relayer'],
        type: 'Docker images',
    },
    'ethereum-types': {
        // @TODO: Fix description
        title: 'Ethereum types',
        description: '',
        topics: ['Mesh'],
        difficulty: 'Intermediate',
        isCommunity: true,
        isFeatured: true,
        tags: ['Protocol developer'],
        type: 'Command-line tools',
    },
};
