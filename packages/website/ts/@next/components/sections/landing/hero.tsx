import * as React from 'react';
import {Button, ButtonWrap} from 'ts/@next/components/button';
import {LandingAnimation} from 'ts/@next/components/heroImage';
import {Column, Section, Wrap, WrapCentered, WrapGrid} from 'ts/@next/components/layout';
import {Heading, Paragraph} from 'ts/@next/components/text';

import {Hero} from 'ts/@next/components/hero';

import LogoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';

export const SectionLandingHero = () => (
    <Hero
        title="Powering Decentralized Exchange"
        description="0x is the best solution for adding exchange functionality to your business."
        figure={<LandingAnimation image={<LogoOutlined />} />}
        actions={<Actions />}
    />
);

const Actions = () => (
    <>
        <Button isInline={true}>
            Get Started
        </Button>

        <Button isTransparent={true} isInline={true}>
            Learn More
        </Button>
    </>
);
