import * as React from 'react';

import { Button } from 'ts/components/button';
import { Hero } from 'ts/components/hero';
import { LandingAnimation } from 'ts/components/heroImage';

import { HeroAnimation } from 'ts/components/heroAnimation';
import { WebsitePaths } from 'ts/types';

// const announcement = {
//     headline: 'Vote on ZEIP-24 & ZEIP-39',
//     href: '/vote',
//     shouldOpenInNewTab: false,
// };

export const SectionLandingHero = () => (
    <Hero
        title="Powering Decentralized Exchange"
        isLargeTitle={true}
        isFullWidth={true}
        description="0x is an open protocol that enables the peer-to-peer exchange of assets on the Ethereum blockchain."
        figure={<LandingAnimation image={<HeroAnimation />} />}
        actions={<HeroActions />}
        // announcement={announcement}
    />
);

const HeroActions = () => (
    <>
        <Button href="https://0x.org/docs" isInline={true}>
            Get Started
        </Button>

        <Button to={WebsitePaths.Why} isTransparent={true} isInline={true}>
            Learn More
        </Button>
    </>
);
