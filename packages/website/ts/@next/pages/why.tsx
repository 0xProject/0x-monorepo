import * as _ from 'lodash';
import * as React from 'react';
import AnchorLink from 'react-anchor-link-smooth-scroll';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import {Hero} from 'ts/@next/components/hero';

import { Banner } from 'ts/@next/components/banner';
import { Link } from 'ts/@next/components/button';
import { Icon } from 'ts/@next/components/icon';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Slide, Slider } from 'ts/@next/components/slider/slider';
import { Heading, Paragraph } from 'ts/@next/components/text';

import {Definition} from 'ts/@next/components/definition';
import {Column, Section, WrapSticky} from 'ts/@next/components/newLayout';

const offersData = [
    {
        icon: 'robustSmartContracts',
        title: 'Robust Smart Contracts',
        description: `0x Protocol's smart contracts have been put through two rounds of rigorous security audits.`,
    },
    {
        icon: 'extensibleArchitecture',
        title: 'Extensible Architecture',
        description: `0x's modular pipeline enables you to plug in your own smart contracts through an extensible API.`,
    },
    {
        icon: 'eficientDesign',
        title: 'Efficient Design',
        description: `0x’s off-chain order relay with on-chain settlement is a gas efficient approach to p2p exchange, reducing blockchain bloat.`,
    },
];

const functionalityData = [
    {
        icon: 'secureTrading',
        title: 'Secure Non-custodial Trading',
        description: 'Enable tokens to be traded wallet-to-wallet with no deposits or withdrawals.',
    },
    {
        icon: 'flexibleOrders',
        title: 'Flexible Order Types',
        description: 'Choose to sell assets at a specific “buy it now” price or allow potential buyers to submit bids.',
    },
    {
        icon: 'buildBusiness',
        title: 'Build a Business',
        description: 'Monetize your product by taking fees on each transaction and join a growing number of relayers in the 0x ecosystem.',
    },
];

const useCaseSlides = [
    {
        icon: 'gamingAndCollectibles',
        title: 'Games & Collectibles',
        description: 'Artists and game makers are tokenizing digital art and in-game items known as non-fungible tokens (NFTs). 0x enables these creators to add exchange functionality by providing the ability to build marketplaces for NFT trading.',
    },
    {
        icon: 'predictionMarkets',
        title: 'Prediction Markets',
        description: 'Decentralized prediction markets and cryptodervivative platforms generate sets of tokens that represent a financial stake in the outcomes of events. 0x allows these tokens to be instantly tradable in liquid markets.',
    },
    {
        icon: 'orderBooks',
        title: 'Order Books',
        description: 'There are thousands of decentralized apps and protocols that have native utility tokens. 0x provides professional exchanges with the ability to host order books and facilitates the exchange of these assets.',
    },
    {
        icon: 'decentralisedLoans',
        title: 'Decentralized Loans',
        description: 'Efficient lending requires liquid markets where investors can buy and re-sell loans. 0x enables an ecosystem of lenders to self-organize and efficiently determine market prices for all outstanding loans.',
    },
];

export class NextWhy extends React.PureComponent {
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="dark">
                <Hero
                    title="The exchange layer for the crypto economy"
                    description="The world's assets are becoming tokenized on public blockchains. 0x Protocol is free, open-source infrastructure that allows anyone in the world to build products that enable the purchasing and trading of crypto tokens."
                    actions={
                        <Link
                            href="/docs"
                            isCentered={true}
                            isWithArrow={true}
                            isAccentColor={true}
                        >
                          Build on 0x
                        </Link>
                    }
                />

                <Section
                    bgColor="dark"
                    isFlex={true}
                    maxWidth="1170px"
                >
                    <Definition
                        title="Support for all Ethereum Standards"
                        description="0x Protocol facilitates the decentralized exchange of a growing number of Ethereum-based tokens, including all ERC-20 and ERC-721 assets. Additional ERC standards can be added to the protocol..."
                        icon="supportForAllEthereumStandards"
                        iconSize="large"
                        isInline={true}
                    />

                    <Definition
                        title="Shared Networked Liquidity"
                        description="0x is building a layer of networked liquidity that will lower the barriers to entry. By enabling businesses to tap into a shared pool of digital assets, it will create a more stable financial system."
                        icon="networkedLiquidity"
                        iconSize="large"
                        isInline={true}
                    />

                    <Definition
                        title="Support for all Ethereum Standards"
                        description="Relayers are businesses around the world that utilize 0x to integrate exchange functionality into a wide variety of products including order books, games, and digital art marketplaces."
                        icon="flexibleIntegration"
                        iconSize="large"
                        isInline={true}
                    />
                </Section>

              <Section maxWidth="1170px" isFlex={true} isFullWidth={true}>
                  <Column>
                      <NavStickyWrap offsetTop="130px">
                          <ChapterLink offset="60" href="#benefits">Benefits</ChapterLink>
                          <ChapterLink offset="60" href="#cases">Use Cases</ChapterLink>
                          <ChapterLink offset="60" href="#functionality">Features</ChapterLink>
                      </NavStickyWrap>
                  </Column>

                    <Column width="55%" maxWidth="826px">
                        <Column width="100%" maxWidth="560px" padding="0 30px 0 0">
                            <SectionWrap id="benefits">
                                <Heading size="medium">What 0x offers</Heading>

                                {_.map(offersData, (item, index) => (
                                    <Definition
                                        key={`offers-${index}`}
                                        icon={item.icon}
                                        title={item.title}
                                        description={item.description}
                                        isWithMargin={true}
                                    />
                                ))}
                            </SectionWrap>

                            <SectionWrap id="cases" isNotRelative={true}>
                                <Heading size="medium">Use Cases</Heading>
                                <Slider>
                                    {_.map(useCaseSlides, (item, index) => (
                                        <Slide
                                            key={`useCaseSlide-${index}`}
                                            heading={item.title}
                                            text={item.description}
                                            icon={item.icon}
                                        />
                                    ))}
                                </Slider>
                            </SectionWrap>

                            <SectionWrap id="functionality">
                                <Heading size="medium">Exchange Functionality</Heading>

                                {_.map(functionalityData, (item, index) => (
                                    <Definition
                                        key={`functionality-${index}`}
                                        icon={item.icon}
                                        title={item.title}
                                        description={item.description}
                                        isWithMargin={true}
                                    />
                                ))}
                            </SectionWrap>
                        </Column>
                    </Column>
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

interface SectionProps {
    isNotRelative?: boolean;
}

const SectionWrap = styled.div<SectionProps>`
    position: ${props => !props.isNotRelative && 'relative'};

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

    @media (min-width: 768px) {
        & + &:before {
            width: 100vw;
        }
    }

    @media (max-width: 768px) {
        text-align: left;

        & + &:before {
            width: 100%;
        }
    }
`;

const NavStickyWrap = styled(WrapSticky)`
    padding-left: 60px;
    z-index: 9999;

    @media (max-width: 768px) {
        display: none;
    }
`;

const ChapterLink = styled(AnchorLink)`
    color: ${props => props.theme.textColor};
    font-size: 22px;
    margin-bottom: 25px;
    display: block;
    opacity: 0.8;

    &:hover,
    &:active {
        opacity: 1;
    }
`;

const ChapterItemWrap = styled.div`
    max-width: 560px;
    margin-top: 60px;
`;
