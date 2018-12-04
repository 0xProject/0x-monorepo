import * as React from 'react';

import {colors} from 'ts/style/colors';

import {Button} from 'ts/@next/components/button';
import {Column, Section, Wrap, WrapCentered} from 'ts/@next/components/layout';
import {SiteWrap} from 'ts/@next/components/siteWrap';
import {Heading, Paragraph} from 'ts/@next/components/text';

import LogoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';
import ProtocolIcon from 'ts/@next/icons/illustrations/protocol.svg';
import TokensIcon from 'ts/@next/icons/illustrations/tokens.svg';

export const Next0xInstant = () => (
    <SiteWrap>
        <Section>
            <WrapCentered>
                <Heading size="medium" isCentered={true}>Introducing 0x Instant</Heading>
                <Paragraph size="medium" isCentered={true}>A free and flexible way to offer simple crypto purchasing in any app or website</Paragraph>
                <Button href="#">Get Started</Button>
            </WrapCentered>
        </Section>

        <Section isFullWidth={true} isNoPadding={true}>
            <Wrap width="full">
                <img src="/images/@next/0x-instant/0x-instant-widgets@2x.png" alt="Preview of payment widgets"/>
            </Wrap>
        </Section>

        <Section>
            <Wrap>
                <Column colWidth="1/3">
                    <TokensIcon width="248"/>
                </Column>

                <Column colWidth="2/3">
                    <Heading>Support ERC-20 and ERC-721 tokens</Heading>
                    <Paragraph isMuted={true}>Seamlessly integrate token purchasing into your product experience by offering digital assets ranging from in-game items to stablecoins.</Paragraph>
                    <div>
                        <a href="#">Get Started</a><a href="#">Explore the Docs</a>
                    </div>
                </Column>
            </Wrap>
        </Section>
        <Section>
            <Wrap>
                <Column colWidth="1/3">
                    <ProtocolIcon width="248"/>
                </Column>

                <Column colWidth="2/3">
                    <Heading>Generate revenue for your business</Heading>
                    <Paragraph isMuted={true}>With just a few lines of code, you can earn up to 5% in affiliate fees on every transaction from your crypto wallet or dApp.</Paragraph>
                    <div>
                        <a href="#">Learn more about affiliate fees</a>
                    </div>
                </Column>
            </Wrap>
        </Section>
        <Section>
            <Wrap>
                <Column colWidth="1/3">
                    <LogoOutlined width="248"/>
                </Column>

                <Column colWidth="2/3">
                    <Heading>Easy and flexible integration</Heading>
                    <Paragraph isMuted={true}>Use our out-of-the-box design or customize the user interface by integrating the AssetBuyer engine. You can also tap into 0x networked liquidity or choose your own liquidity pool.</Paragraph>
                    <div>
                        <a href="#">Explore AssetBuyer</a>
                        <a href="#">Learn about liquidity</a>
                    </div>
                </Column>
            </Wrap>
        </Section>

        <Section bgColor={colors.backgroundDark}>
            <Wrap>
                <Column colWidth="1/2">
                    <Heading>0x Instant Configurator</Heading>
                    <Paragraph>Liquidity Source</Paragraph>
                    <Paragraph>What tokens can users buy? (select all)</Paragraph>
                    <Paragraph>Transaction fee ETH address</Paragraph>
                    <Paragraph>Fee Percentage</Paragraph>
                </Column>

                <Column colWidth="1/2">
                    <Paragraph>Code Snippet</Paragraph>
                    <a href="#">Explore the Docs</a>
                    <Paragraph>&lt;code snippet&gt;</Paragraph>
                </Column>
            </Wrap>
        </Section>

        <Section bgColor={colors.brandDark}>
            <Wrap>
                <Column colWidth="1/2" isPadLarge={true}>
                    <WrapCentered>
                        <Heading>Need more flexibility?</Heading>
                        <Paragraph>Dive into our docs, or contact us if needed</Paragraph>
                    </WrapCentered>
                </Column>

                <Column colWidth="1/2" isPadLarge={true}>
                    <WrapCentered>
                        <div>
                            <Button href="#">Explore the Docs</Button>
                            <Button href="#" isTransparent={true}>Get in Touch</Button>
                        </div>
                    </WrapCentered>
                </Column>
            </Wrap>
        </Section>

        <Section>
            <Wrap width="full">
                <Column>
                    <Paragraph size="small" isMuted={0.5}>Disclaimer: The laws and regulations applicable to the use and exchange of digital assets and blockchain-native tokens, including through any software developed using the licensed work created by ZeroEx Intl. (the “Work”), vary by jurisdiction. As set forth in the Apache License, Version 2.0 applicable to the Work, developers are “solely responsible for determining the appropriateness of using or redistributing the Work,” which includes responsibility for ensuring compliance with any such applicable laws and regulations.</Paragraph>
                    <Paragraph size="small" isMuted={0.5}>See the Apache License, Version 2.0 for the specific language governing all applicable permissions and limitations.</Paragraph>
                </Column>
            </Wrap>
        </Section>
    </SiteWrap>
);
