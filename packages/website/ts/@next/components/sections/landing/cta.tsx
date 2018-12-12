import * as React from 'react';
import {Button, ButtonWrap, Link} from 'ts/@next/components/button';
import {Icon, InlineIconWrap} from 'ts/@next/components/icon';
import {Wrap, WrapCentered, WrapGrid} from 'ts/@next/components/layout';
import {Heading, Paragraph} from 'ts/@next/components/text';

import {Column, Section} from 'ts/@next/components/newLayout';

import {BlockIconLink} from 'ts/@next/components/blockIconLink';

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
            icon=""
            title="Ready to build on 0x?"
            linkLabel="Get Started"
            linkUrl="#"
        />
        <BlockIconLink
            icon="coin"
            title="Wat help from the 0x team?"
            linkLabel="Get in Touch"
            onClick={props.onContactClick}
        />
    </Section>
);
