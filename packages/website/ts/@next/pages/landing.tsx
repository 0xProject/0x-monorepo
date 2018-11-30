import * as React from 'react';
import styled, { css } from 'styled-components';

import {colors} from 'ts/style/colors';

import {Button, ButtonWrap} from 'ts/@next/components/button';
import {Column, Section, Wrap, WrapCentered} from 'ts/@next/components/layout';
import {SiteWrap} from 'ts/@next/components/siteWrap';
import {Heading, Paragraph} from 'ts/@next/components/text';

import LogoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';
import ProtocolIcon from 'ts/@next/icons/illustrations/protocol.svg';
import IconReadyToBuild from 'ts/@next/icons/illustrations/ready-to-build.svg';


const Icon = styled.div `
    flex-shrink: 0;
`;

export const NextLanding = () => (
    <SiteWrap>
        <Section>
            <Wrap>
                <Column colWidth="1/2">
                    <Heading size="large">
                        Powering Decentralized Exchange
                    </Heading>

                    <Paragraph size="medium">
                        0x is the best solution for adding exchange functionality to your business.
                    </Paragraph>

                    <ButtonWrap>
                        <Button inline>
                            Get Started
                        </Button>

                        <Button transparent inline>
                            Learn More
                        </Button>
                    </ButtonWrap>
                </Column>

                <Column colWidth="1/2">
                    <LogoOutlined/>
                </Column>
            </Wrap>
        </Section>

        <Section bgColor={colors.backgroundDark}>
            <WrapCentered width="narrow">
                <ProtocolIcon/>

                <Paragraph size="large" center>
                    0x is an open protocol that enables the peer-to-peer exchange of Ethereum-based
                    tokens. Anyone in the world can use 0x to service a wide variety of markets
                    ranging from gaming items to financial instruments to assets that could have
                    near existed before.
                </Paragraph>

                <Button href="#" transparent>
                    Discover how developers use 0x
                </Button>
            </WrapCentered>

            <Wrap>
                {/* NOTE: this probably should be withComponent as part of a <dl> */}
                <Column colWidth="1/3">
                    <Heading size="medium" center>
                        873,435
                    </Heading>

                    <Paragraph muted={0.4} center noMargin>
                        Number of transactions
                    </Paragraph>
                </Column>

                <Column colWidth="1/3">
                    <Heading size="medium" center>
                        $203M
                    </Heading>

                    <Paragraph muted={0.4} center noMargin>
                        Total volume
                    </Paragraph>
                </Column>

                <Column colWidth="1/3">
                    <Heading size="medium" center>
                        227,372
                    </Heading>

                    <Paragraph muted={0.4} center noMargin>
                        Number of relayers
                    </Paragraph>
                </Column>
            </Wrap>
        </Section>

        <Section>
            <Wrap>
                <Column bgColor="#003831" colWidth="1/2" padLarge>
                    <WrapCentered>
                        <IconReadyToBuild />
                        Ready to build on 0x?
                    </WrapCentered>
                </Column>

                <Column bgColor="#003831" colWidth="1/2" padLarge>
                    <WrapCentered>
                        <IconReadyToBuild />
                        Ready to build on 0x?
                    </WrapCentered>
                </Column>
            </Wrap>
        </Section>

        <Section>
            <Wrap>
                <Column colWidth="2/3">
                    Powering Decentralized Exchange<br/>
                    Example of a 2/3 1/3 assymetric composition
                </Column>

                <Column colWidth="1/3">
                    RIGHT IMAGE
                </Column>
            </Wrap>
        </Section>

        <Section
            bgColor="#ff0000"
            fullWidth
            noPadding>
            <Wrap width="full">
                <Column colWidth="2/3">
                    SAMPLE FLUSHED width
                </Column>

                <Column colWidth="1/3">
                    RIGHT IMAGE
                </Column>
            </Wrap>
        </Section>

        <Section bgColor="#003831">
            <Wrap width="narrow">
                0x is an open protocol that enables the peer-to-peer exchange of Ethereum-based tokens. Anyone can utilize 0x to service a wide variety of markets ranging from gaming items to traditional financial assets.
            </Wrap>

            <Wrap>
                <Column colWidth="1/3">
                    This
                </Column>

                <Column colWidth="1/3">
                    is a
                </Column>

                <Column colWidth="1/3">
                     three-column module
                </Column>
            </Wrap>
        </Section>
    </SiteWrap>
);
