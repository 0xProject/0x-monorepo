import * as React from 'react';
import * as _ from 'lodash';
import styled from 'styled-components';

import {colors} from 'ts/style/colors';
import {Button, ButtonWrap} from 'ts/@next/components/button';
import {Column, Section, Wrap, WrapCentered, WrapGrid} from 'ts/@next/components/layout';
import {SiteWrap} from 'ts/@next/components/siteWrap';
import {Heading, Paragraph} from 'ts/@next/components/text';

import LogoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';
import ProtocolIcon from 'ts/@next/icons/illustrations/protocol.svg';
import IconReadyToBuild from 'ts/@next/icons/illustrations/ready-to-build.svg';


/**
    Note(ez): Maybe when we're done at least with a basic structure,
    we can take out each section into e.g. LandingSectionIntro.tsx in
    @next/sections/landing ? so then our routes would only look like

    <SiteWrap>
        <LandingSectionIntro />
        <LandingSectionWhatever />
    </SiteWrap>
*/
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

        <Section bgColor={colors.backgroundDark} padLarge>
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

            <Wrap margin={['large', 0, 0, 0]}>
                {/* NOTE: this probably should be withComponent as part of a <dl> */}
                <Column colWidth="1/3" noPadding>
                    <Heading size="medium" center>
                        873,435
                    </Heading>

                    <Paragraph muted={0.4} center noMargin>
                        Number of transactions
                    </Paragraph>
                </Column>

                <Column colWidth="1/3" noPadding>
                    <Heading size="medium" center>
                        $203M
                    </Heading>

                    <Paragraph muted={0.4} center noMargin>
                        Total volume
                    </Paragraph>
                </Column>

                <Column colWidth="1/3" noPadding>
                    <Heading size="medium" center>
                        227,372
                    </Heading>

                    <Paragraph muted={0.4} center noMargin>
                        Number of relayers
                    </Paragraph>
                </Column>
            </Wrap>
        </Section>

        <Section padLarge>
            <WrapCentered>
                <Heading size="small">You're in good company</Heading>
            </WrapCentered>

            <WrapGrid width="narrow">
                {_.map([...Array(9)], (item, index) => (
                    <SampleLogo />
                ))}
            </WrapGrid>
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
    </SiteWrap>
);


const SampleLogo = styled.div`
    width: 60px;
    height: 60px;
    border: 1px solid blue;
    margin: 30px 60px;
`;
