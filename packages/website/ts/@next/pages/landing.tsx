import * as React from 'react';
import {SiteWrap} from 'ts/@next/components/siteWrap';

import {SectionLandingAbout} from 'ts/@next/components/sections/landing/about';
import {SectionLandingClients} from 'ts/@next/components/sections/landing/clients';
import {SectionLandingCta} from 'ts/@next/components/sections/landing/cta';
import {SectionLandingHero} from 'ts/@next/components/sections/landing/hero';

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
