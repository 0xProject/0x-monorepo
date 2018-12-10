import * as React from 'react';
import {Button, ButtonWrap} from 'ts/@next/components/button';
import {Column, Section, Wrap, WrapCentered, WrapGrid} from 'ts/@next/components/layout';
import {Heading, Paragraph} from 'ts/@next/components/text';

import LogoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';

export const SectionLandingHero = () => (
    <Section isPadLarge={true}>
        <Wrap isReversed={true}>
            <Column colWidth="1/2">
                <WrapCentered>
                    <LogoOutlined/>
                </WrapCentered>
            </Column>

            <Column colWidth="1/2">
                <Heading size="large">
                    Powering Decentralized Exchange
                </Heading>

                <Paragraph size="medium" isMuted={true}>
                    0x is the best solution for adding<br />
                    exchange functionality to your business.
                </Paragraph>

                <ButtonWrap>
                    <Button isInline={true}>
                        Get Started
                    </Button>

                    <Button isTransparent={true} isInline={true}>
                        Learn More
                    </Button>
                </ButtonWrap>
            </Column>
        </Wrap>
    </Section>
);
