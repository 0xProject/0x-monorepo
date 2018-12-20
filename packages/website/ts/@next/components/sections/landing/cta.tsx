import * as React from 'react';

import { BlockIconLink } from 'ts/@next/components/blockIconLink';
import { Section } from 'ts/@next/components/newLayout';

import { AnimatedChatIcon } from 'ts/@next/components/animatedChatIcon';
import { AnimatedCompassIcon } from 'ts/@next/components/animatedCompassIcon';
import { WebsitePaths } from 'ts/types';

interface Props {
    onContactClick?: () => void;
}

export const SectionLandingCta = (props: Props) => (
    <Section isPadded={false} isFlex={true} maxWidth="auto" wrapWidth="100%" flexBreakpoint="900px">
        <BlockIconLink
            iconComponent={<AnimatedCompassIcon />}
            title="Ready to build on 0x?"
            linkLabel="Get Started"
            linkUrl={WebsitePaths.Docs}
        />
        <BlockIconLink
            iconComponent={<AnimatedChatIcon />}
            title="Want help from the 0x team?"
            linkLabel="Get in Touch"
            linkAction={props.onContactClick}
        />
    </Section>
);
