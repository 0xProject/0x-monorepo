import * as React from 'react';

import {BlockIconLink} from 'ts/@next/components/blockIconLink';
import {Section} from 'ts/@next/components/newLayout';

interface Props {
    onContactClick?: () => void;
}

export const SectionLandingCta = (props: Props) => (
    <Section
        isPadded={false}
        isFlex={true}
        maxWidth="auto"
        wrapWidth="100%"
        flexBreakpoint="900px"
    >
        <BlockIconLink
            icon="getStarted"
            title="Ready to build on 0x?"
            linkLabel="Get Started"
            linkUrl="https://0xproject.com/docs"
        />
        <BlockIconLink
            icon="getInTouch"
            title="Want help from the 0x team?"
            linkLabel="Get in Touch"
            linkAction={props.onContactClick}
        />
    </Section>
);
