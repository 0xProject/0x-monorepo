import * as _ from 'lodash';
import * as React from 'react';
import AnchorLink from 'react-anchor-link-smooth-scroll';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Banner } from 'ts/@next/components/banner';
import { Link } from 'ts/@next/components/button';
import { Icon } from 'ts/@next/components/icon';
import { BREAKPOINTS, Column, Section, Wrap, WrapCentered, WrapSticky } from 'ts/@next/components/layout';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Paragraph } from 'ts/@next/components/text';

import CoinIcon from 'ts/@next/icons/illustrations/coin.svg';
import CustomizeIcon from 'ts/@next/icons/illustrations/customize.svg';
import ProtocolIcon from 'ts/@next/icons/illustrations/protocol.svg';

const offersData = [
    {
        icon: 'coin',
        title: 'A standard for Exchange',
        description: '0x provides developers with a technical standard for trading Ethereum-based tokens such as ERC 20 and ERC 721.',
    },
    {
        icon: 'coin',
        title: 'Robust Smart Contracts',
        description: `0x Protocol's smart contracts have been put through two rounds of rigorous security audits.`,
    },
    {
        icon: 'coin',
        title: 'Extensible Architecture',
        description: `0x's modular pipeline enables you to plug in your own smart contracts through an extensible API.`,
    },
    {
        icon: 'coin',
        title: 'Efficient Design',
        description: `0x’s off-chain order relay with on-chain settlement is a gas efficient approach to p2p exchange, reducing blockchain bloat.`,
    },
];

const functionalityData = [
    {
        icon: 'coin',
        title: 'Secure Non-custodial Trading',
        description: 'Enable tokens to be traded wallet-to-wallet with no deposits or withdrawals.',
    },
    {
        icon: 'coin',
        title: 'Flexible Order Types',
        description: 'Choose to sell assets at a specific “buy it now” price or allow potential buyers to submit bids.',
    },
    {
        icon: 'coin',
        title: 'Build a Business',
        description: 'Monetize your product by taking fees on each transaction and join a growing number of relayers in the 0x ecosystem.',
    },
    {
        icon: 'coin',
        title: 'Networked Liquidity',
        description: 'Allow your assets to appear on other 0x-based marketplaces by sharing your liquidity through an open order book.',
    },
];

export class NextWhy extends React.PureComponent {
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="dark">
              <Section isPadLarge={true}>
                <WrapCentered>
                  <Column colWidth="2/3" isNoMargin={true}>
                      <Heading
                          size="medium"
                          isCentered={true}
                      >
                          The exchange layer for<br />
                          the crypto economy
                      </Heading>

                      <Paragraph
                          size="medium"
                          isMuted={true}
                          isCentered={true}
                          marginBottom="60px"
                      >
                          The world's assets are becoming tokenized on public blockchains. 0x Protocol is free, open-source infrastructure that allows anyone in the world to build products that enable the purchasing and trading of crypto tokens.
                      </Paragraph>

                        <Link
                            href="/docs"
                            isCentered={true}
                            isWithArrow={true}
                            isAccentColor={true}
                        >
                          Build on 0x
                        </Link>
                  </Column>
                </WrapCentered>
              </Section>

              <Section bgColor={colors.backgroundDark} isPadLarge={true}>
                <Wrap>
                  <Column colWidth="1/3">
                      <Icon name="coin" size="large" margin={[0, 0, 32, 0]} />
                      <Heading size="small" marginBottom="15px">Support for all Ethereum Standards</Heading>
                      <Paragraph isMuted={true}>0x Protocol facilitates the decentralized exchange of a growing number of Ethereum-based tokens, including all ERC-20 and ERC-721 assets. Additional ERC standards can be added to the protocol...</Paragraph>
                  </Column>

                  <Column colWidth="1/3">
                      <Icon name="coin" size="large" margin={[0, 0, 32, 0]} />
                      <Heading size="small" marginBottom="15px">Shared Networked Liquidity</Heading>
                      <Paragraph isMuted={true}>0x is building a layer of networked liquidity that will lower the barriers to entry. By enabling businesses to tap into a shared pool of digital assets, it will create a more stable financial system.</Paragraph>
                  </Column>

                  <Column colWidth="1/3">
                      <Icon name="coin" size="large" margin={[0, 0, 32, 0]} />
                      <Heading size="small" marginBottom="15px">Customize the User Experience</Heading>
                      <Paragraph isMuted={true}>Relayers are businesses around the world that utilize 0x to integrate exchange functionality into a wide variety of products including order books, games, and digital art marketplaces.</Paragraph>
                  </Column>
                </Wrap>
              </Section>

              <Section>
                <Wrap>
                  <Column colWidth="1/3">
                      <NavStickyWrap offsetTop="130px">
                          <ChapterLink offset="60" href="#benefits">Benefits</ChapterLink>
                          <ChapterLink offset="60" href="#cases">Use Cases</ChapterLink>
                          <ChapterLink offset="60" href="#functionality">Features</ChapterLink>
                      </NavStickyWrap>
                  </Column>

                  <Column colWidth="2/3">
                        <SectionWrap id="benefits">
                            <Heading size="medium">What 0x offers</Heading>

                            {_.map(offersData, (item, index) => (
                                <ChapterItemWrap>
                                    <Icon name={item.icon} size="medium" margin={[0, 0, 22, 0]} />

                                    <Heading marginBottom="15px">
                                        {item.title}
                                    </Heading>

                                    <Paragraph isMuted={true} isNoMargin={true}>
                                        {item.description}
                                    </Paragraph>
                                </ChapterItemWrap>
                            ))}
                        </SectionWrap>

                        <SectionWrap id="cases">
                            <Heading size="medium">Use Cases</Heading>
                            <Paragraph isMuted={true}>slider</Paragraph>
                        </SectionWrap>

                        <SectionWrap id="functionality">
                            <Heading size="medium">Exchange Functionality</Heading>

                            {_.map(functionalityData, (item, index) => (
                                <ChapterItemWrap>
                                    <Icon name={item.icon} size="medium" margin={[0, 0, 22, 0]} />

                                    <Heading marginBottom="15px">
                                        {item.title}
                                    </Heading>

                                    <Paragraph isMuted={true} isNoMargin={true}>
                                        {item.description}
                                    </Paragraph>
                                </ChapterItemWrap>
                            ))}
                        </SectionWrap>
                  </Column>
                </Wrap>
              </Section>

              <Banner
                heading="Ready to get started?"
                subline="Dive into our docs, or contact us if needed"
                mainCta={{ text: 'Get Started', href: '/docs' }}
                secondaryCta={{ text: 'Get in Touch', href: '/contact' }}
              />
            </SiteWrap>
        );
    }
}

const SectionWrap = styled.div`
    position: relative;

    & + & {
        padding-top: 60px;
        margin-top: 60px;
    }

    & + &:before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 1px;
        background-color: #3d3d3d;
    }

    @media (min-width: ${BREAKPOINTS.mobile}) {
        & + &:before {
            width: 100vw;
        }
    }

    @media (max-width: ${BREAKPOINTS.mobile}) {
        text-align: left;

        & + &:before {
            width: 100%;
        }
    }
`;

const NavStickyWrap = styled(WrapSticky)`
    @media (max-width: ${BREAKPOINTS.mobile}) {
        display: none;
    }
`;

const ChapterLink = styled(AnchorLink)`
    color: ${props => props.theme.textColor};
    font-size: 22px;
    margin-bottom: 15px;
    display: block;
    opacity: 0.8;

    &:hover {
        opacity: 1;
    }
`;

const ChapterItemWrap = styled.div`
    max-width: 560px;
    margin-top: 60px;
`;
