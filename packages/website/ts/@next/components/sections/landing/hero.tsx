import * as React from 'react';

import {Button} from 'ts/@next/components/button';
import {Hero} from 'ts/@next/components/hero';
import {LandingAnimation} from 'ts/@next/components/heroImage';

import {HeroAnimation} from 'ts/@next/components/heroAnimation';

export const SectionLandingHero = () => (
    <Hero
        title="Powering Decentralized Exchange"
        description="0x is the best solution for adding exchange functionality to your business."
        figure={<LandingAnimation image={<HeroAnimation />} />}
        actions={<HeroActions />}
    />
);

const HeroActions = () => (
    <>
        <Button href="https://0xproject.com/docs" isInline={true}>
            Get Started
        </Button>

        <Button href="/why" isTransparent={true} isInline={true}>
            Learn More
        </Button>
    </>
);
