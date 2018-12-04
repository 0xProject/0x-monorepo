import * as React from 'react';

import {colors} from 'ts/style/colors';

import {Button} from 'ts/@next/components/button';
import {Column, Section, Wrap, WrapCentered} from 'ts/@next/components/layout';
import {SiteWrap} from 'ts/@next/components/siteWrap';
import {Heading, Paragraph} from 'ts/@next/components/text';

import ProtocolIcon from 'ts/@next/icons/illustrations/protocol.svg';
import TokensIcon from 'ts/@next/icons/illustrations/tokens.svg';

export const NextLaunchKit = () => (
    <SiteWrap>
        <Section>
            <WrapCentered>
                <Heading size="medium" isCentered={true}>
                    0x Launch Kit
                </Heading>
                <Paragraph size="medium" isCentered={true} isMuted={true}>
                    The definitive starting point for building a business on top of the 0x protocol.
                </Paragraph>
                <Button href="#">
                    Get Started
                </Button>
            </WrapCentered>
        </Section>

        <Section>
            <Wrap>
                <Column
                    borderColor="#003831"
                    colWidth="1/3"
                    isPadLarge={true}
                >
                    <WrapCentered>
                        <ProtocolIcon width="140" />
                        <Paragraph isCentered={true}>
                            Tap into and share liquidity with other relayers
                        </Paragraph>
                    </WrapCentered>
                </Column>
                <Column
                    borderColor="#003831"
                    colWidth="1/3"
                    isPadLarge={true}
                >
                    <WrapCentered>
                        <ProtocolIcon width="140" />
                        <Paragraph isCentered={true}>
                            Tap into and share liquidity with other relayers
                        </Paragraph>
                    </WrapCentered>
                </Column>
                <Column
                    borderColor="#003831"
                    colWidth="1/3"
                    isPadLarge={true}
                >
                    <WrapCentered>
                        <ProtocolIcon width="140" />
                        <Paragraph isCentered={true}>
                            Tap into and share liquidity with other relayer
                        </Paragraph>
                    </WrapCentered>
                </Column>
            </Wrap>
        </Section>

        <Section>
            <Wrap>
                <Column colWidth="1/3">
                    <TokensIcon width="248"/>
                </Column>

                <Column colWidth="2/3">
                    <Heading size="small">
                        Working on a new token?
                    </Heading>
                    <Paragraph isMuted={true}>
                        Easily create a secondary market for your asset/asset clas
                    </Paragraph>
                </Column>
            </Wrap>
        </Section>
        <Section>
            <Wrap>
                <Column colWidth="1/3">
                    <TokensIcon width="248"/>
                </Column>

                <Column colWidth="2/3">
                    <Heading size="small">
                        Working on a new game?
                    </Heading>
                    <Paragraph isMuted={true}>
                        Easily create an in-app marketplace
                    </Paragraph>
                </Column>
            </Wrap>
        </Section>
        <Section>
            <Wrap>
                <Column colWidth="1/3">
                    <TokensIcon width="248"/>
                </Column>

                <Column colWidth="2/3">
                    <Heading size="small">
                        No exchange in your location?
                    </Heading>
                    <Paragraph isMuted={true}>
                        Build a 0x relayer for your contry’s market
                    </Paragraph>
                </Column>
            </Wrap>
        </Section>

        <Section bgColor={colors.backgroundDark}>
            <Wrap>
                <Column colWidth="1/2">
                    <Heading>
                        0x Instant Configurator
                    </Heading>
                    <Paragraph>
                        Liquidity Source
                    </Paragraph>
                    <Paragraph>
                        What tokens can users buy? (select all)
                    </Paragraph>
                    <Paragraph>
                        Transaction fee ETH address
                    </Paragraph>
                    <Paragraph>
                        Fee Percentage
                    </Paragraph>
                </Column>

                <Column colWidth="1/2">
                    <Paragraph>
                        Code Snippet
                    </Paragraph>
                    <a href="#">Explore the Docs</a>
                    <Paragraph>
                        &lt;code snippet&gt;
                    </Paragraph>
                </Column>
            </Wrap>
        </Section>

        <Section bgColor={colors.brandDark}>
            <Wrap>
                <Column colWidth="1/2" isPadLarge={true}>
                    <WrapCentered>
                        <Heading>
                            Need more flexibility?
                        </Heading>
                        <Paragraph>
                            Dive into our docs, or contact us if needed
                        </Paragraph>
                    </WrapCentered>
                </Column>

                <Column colWidth="1/2" isPadLarge={true}>
                    <WrapCentered>
                        <div>
                            <Button href="#">
                                Explore the Docs
                            </Button>
                            <Button href="#" isTransparent={true}>
                                Get in Touch
                            </Button>
                        </div>
                    </WrapCentered>
                </Column>
            </Wrap>
        </Section>

        <Section>
            <Wrap width="full">
                <Column>
                    <Paragraph size="small" isMuted={0.5}>
                        Disclaimer: The laws and regulations applicable to the use and exchange of digital assets and blockchain-native tokens, including through any software developed using the licensed work created by ZeroEx Intl. (the “Work”), vary by jurisdiction. As set forth in the Apache License, Version 2.0 applicable to the Work, developers are “solely responsible for determining the appropriateness of using or redistributing the Work,” which includes responsibility for ensuring compliance with any such applicable laws and regulations.
                    </Paragraph>
                    <Paragraph size="small" isMuted={0.5}>
                        See the Apache License, Version 2.0 for the specific language governing all applicable permissions and limitations.
                    </Paragraph>
                </Column>
            </Wrap>
        </Section>
    </SiteWrap>
);
