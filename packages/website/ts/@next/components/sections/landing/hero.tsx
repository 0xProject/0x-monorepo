import * as React from 'react';

import {Button} from 'ts/@next/components/button';
import {Hero} from 'ts/@next/components/hero';
import {LandingAnimation} from 'ts/@next/components/heroImage';

import {HeroAnimation} from 'ts/@next/components/heroAnimation';

export const SectionLandingHero = () => (
    <Hero
        title="Powering Decentralized Exchange"
        isLargeTitle={true}
        isFullWidth={true}
        description="0x is an open protocol that enables the peer-to-peer exchange of assets on the Ethereum blockchain."
        figure={<LandingAnimation image={<HeroAnimation />} />}
        actions={<HeroActions />}
    />
);

const HeroActions = () => (
    <>
        <Button href="https://0xproject.com/docs" isInline={true}>
            Get Started
        </Button>

        <Button to="/next/why" isTransparent={true} isInline={true}>
            Learn More
        </Button>
    </>
);
