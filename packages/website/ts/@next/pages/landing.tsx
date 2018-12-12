import * as React from 'react';
import styled from 'styled-components';
import {SiteWrap} from 'ts/@next/components/siteWrap';

import {SectionLandingAbout} from 'ts/@next/components/sections/landing/about';
import {SectionLandingClients} from 'ts/@next/components/sections/landing/clients';
import {SectionLandingCta} from 'ts/@next/components/sections/landing/cta';
import {SectionLandingHero} from 'ts/@next/components/sections/landing/hero';

import {Button} from 'ts/@next/components/button';
import {Hero} from 'ts/@next/components/hero';
import {LandingAnimation} from 'ts/@next/components/heroImage';

import LogoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';

interface Props {
    theme: {
        bgColor: string;
        textColor: string;
        linkColor: string;
    };
}

export const NextLanding: React.StatelessComponent<{}> = (props: Props) => (
    <SiteWrap theme="dark">
        <SectionLandingHero />
        <SectionLandingAbout />
        <SectionLandingClients />
        <SectionLandingCta />
    </SiteWrap>
);
