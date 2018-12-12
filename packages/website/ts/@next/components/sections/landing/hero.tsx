import * as React from 'react';

import {Button} from 'ts/@next/components/button';
import {Hero} from 'ts/@next/components/hero';
import {LandingAnimation} from 'ts/@next/components/heroImage';

import LogoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';

export const SectionLandingHero = () => (
    <Hero
        title="Powering Decentralized Exchange"
        description="0x is the best solution for adding exchange functionality to your business."
        figure={<LandingAnimation image={<LogoOutlined />} />}
        actions={<HeroActions />}
    />
);

const HeroActions = () => (
    <>
        <Button isInline={true}>
            Get Started
        </Button>

        <Button isTransparent={true} isInline={true}>
            Learn More
        </Button>
    </>
);
