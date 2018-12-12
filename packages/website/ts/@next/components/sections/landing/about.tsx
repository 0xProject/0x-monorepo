import * as React from 'react';
import {Button, ButtonWrap, Link} from 'ts/@next/components/button';
import {Icon, InlineIconWrap} from 'ts/@next/components/icon';
import {Heading, Paragraph} from 'ts/@next/components/text';
import {colors} from 'ts/style/colors';

import {Section} from 'ts/@next/components/newLayout';

export const SectionLandingAbout = () => (
    <Section bgColor="dark">
        <InlineIconWrap>
            <Icon name="coin" size="small" />
            <Icon name="coin" size="small" />
            <Icon name="coin" size="small" />
            <Icon name="coin" size="small" />
        </InlineIconWrap>

        <Paragraph
            size="large"
            isCentered={true}
            padding={['large', 0, 'default', 0]}
        >
            0x is an open protocol that enables the peer-to-peer exchange of Ethereum-based
            tokens. Anyone in the world can use 0x to service a wide variety of markets
            ranging from gaming items to financial instruments to assets that could have
            near existed before.
        </Paragraph>

        <Link
            href="#"
            isTransparent={true}
            isWithArrow={true}
            isAccentColor={true}
        >
            Discover how developers use 0x
        </Link>

        <hr
            style={{
                width: '340px',
                borderColor: '#3C4746',
                margin: '60px auto 0 auto',
            }}
        />
    </Section>
);
