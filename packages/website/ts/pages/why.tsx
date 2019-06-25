import * as _ from 'lodash';
import * as React from 'react';
import ScrollableAnchor, { configureAnchors } from 'react-scrollable-anchor';
import styled from 'styled-components';

import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { Definition } from 'ts/components/definition';
import { DocumentTitle } from 'ts/components/document_title';
import { Hero } from 'ts/components/hero';
import { Column, Section, WrapSticky } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Slide, Slider } from 'ts/components/slider/slider';
import { Heading } from 'ts/components/text';
import { documentConstants } from 'ts/utils/document_meta_constants';

import { ModalContact } from '../components/modals/modal_contact';

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
        description:
            'Monetize your product by taking fees on each transaction and join a growing number of relayers in the 0x ecosystem.',
    },
];

const useCaseSlides = [
    {
        icon: 'gamingAndCollectibles',
        title: 'Games & Collectibles',
        description:
            'Artists and game makers are tokenizing digital art and in-game items known as non-fungible tokens (NFTs). 0x enables these creators to add exchange functionality by providing the ability to build marketplaces for NFT trading.',
    },
    {
        icon: 'predictionMarkets',
        title: 'Prediction Markets',
        description:
            'Decentralized prediction markets and cryptodervivative platforms generate sets of tokens that represent a financial stake in the outcomes of events. 0x allows these tokens to be instantly tradable in liquid markets.',
    },
    {
        icon: 'orderBooks',
        title: 'Order Books',
        description:
            'There are thousands of decentralized apps and protocols that have native utility tokens. 0x provides professional exchanges with the ability to host order books and facilitates the exchange of these assets.',
    },
    {
        icon: 'decentralisedLoans',
        title: 'Decentralized Loans',
        description:
            'Efficient lending requires liquid markets where investors can buy and re-sell loans. 0x enables an ecosystem of lenders to self-organize and efficiently determine market prices for all outstanding loans.',
    },
    {
        icon: 'stableTokens',
        title: 'Stable Tokens',
        description:
            'Novel economic constructs such as stable coins require efficient, liquid markets to succeed. 0x will facilitate the underlying economic mechanisms that allow these tokens to remain stable.',
    },
];

configureAnchors({ offset: -60 });

interface Props {
    location: Location;
}

export class NextWhy extends React.Component<Props> {
    public state = {
        isContactModalOpen: false,
    };
    public componentDidMount(): void {
        if (this.props.location.hash.includes('contact')) {
            this._onOpenContactModal();
        }
    }
    public render(): React.ReactNode {
        const buildAction = (
            <Button href="/docs" isWithArrow={true} isAccentColor={true}>
                Build on 0x
            </Button>
        );
        return (
            <SiteWrap theme="dark">
                <DocumentTitle {...documentConstants.WHY} />
                <Hero
                    title="The exchange layer for the crypto economy"
                    description="The world's assets are becoming tokenized on public blockchains. 0x Protocol is free, open-source infrastructure that developers and businesses utilize to build products that enable the purchasing and trading of crypto tokens."
                    actions={buildAction}
                />

                <Section bgColor="dark" isFlex={true} maxWidth="1170px">
                    <Definition
                        title="Support for all Ethereum Standards"
                        titleSize="small"
                        description="0x Protocol facilitates the decentralized exchange of a growing number of Ethereum-based tokens, including all ERC-20 and ERC-721 assets."
                        icon="supportForAllEthereumStandards"
                        iconSize="large"
                        isInline={true}
                    />

                    <Definition
                        title="Networked Liquidity"
                        titleSize="small"
                        description="0x is lowering the barrier to entry by building a layer of networked liquidity that allows businesses to tap into a shared pool of digital assets."
                        icon="networkedLiquidity"
                        iconSize="large"
                        isInline={true}
                    />

                    <Definition
                        title="Flexible Integration"
                        titleSize="small"
                        description="0x is a modular system that enables businesses and projects, known as relayers, to easily add exchange functionality to any product experience."
                        icon="flexibleIntegration"
                        iconSize="large"
                        isInline={true}
                    />
                </Section>

                <Section maxWidth="1170px" isFlex={true} isFullWidth={true}>
                    <Column>
                        <NavStickyWrap offsetTop="130px">
                            <ChapterLink href="#benefits">Benefits</ChapterLink>
                            <ChapterLink href="#cases">Use Cases</ChapterLink>
                            <ChapterLink href="#functionality">Features</ChapterLink>
                        </NavStickyWrap>
                    </Column>

                    <Column width="55%" maxWidth="826px">
                        <Column width="100%" maxWidth="560px" padding="0 30px 0 0">
                            <ScrollableAnchor id="benefits">
                                <SectionWrap>
                                    <SectionTitle size="medium" marginBottom="60px" isNoBorder={true}>
                                        What 0x offers
                                    </SectionTitle>

                                    {_.map(offersData, (item, index) => (
                                        <Definition
                                            key={`offers-${index}`}
                                            icon={item.icon}
                                            title={item.title}
                                            titleSize="small"
                                            description={item.description}
                                            isWithMargin={true}
                                        />
                                    ))}
                                </SectionWrap>
                            </ScrollableAnchor>

                            <ScrollableAnchor id="cases">
                                <SectionWrap isNotRelative={true}>
                                    <SectionTitle size="medium" marginBottom="60px">
                                        Use Cases
                                    </SectionTitle>
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
                            </ScrollableAnchor>

                            <ScrollableAnchor id="functionality">
                                <SectionWrap>
                                    <SectionTitle size="medium" marginBottom="60px">
                                        Exchange Functionality
                                    </SectionTitle>

                                    {_.map(functionalityData, (item, index) => (
                                        <Definition
                                            key={`functionality-${index}`}
                                            icon={item.icon}
                                            title={item.title}
                                            titleSize="small"
                                            description={item.description}
                                            isWithMargin={true}
                                        />
                                    ))}
                                </SectionWrap>
                            </ScrollableAnchor>
                        </Column>
                    </Column>
                </Section>

                <Banner
                    heading="Ready to get started?"
                    subline="Dive into our docs, or contact us if needed"
                    mainCta={{ text: 'Get Started', href: '/docs' }}
                    secondaryCta={{ text: 'Get in Touch', onClick: this._onOpenContactModal.bind(this) }}
                />
                <ModalContact isOpen={this.state.isContactModalOpen} onDismiss={this._onDismissContactModal} />
            </SiteWrap>
        );
    }

    private readonly _onDismissContactModal = (): void => {
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
        this.setState({ isContactModalOpen: false });
    };

    private readonly _onOpenContactModal = (): void => {
        window.history.replaceState(null, null, `${window.location.pathname}${window.location.search}#contact`);
        this.setState({ isContactModalOpen: true });
    };
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

interface SectionTitleProps {
    isNoBorder?: boolean;
}
const SectionTitle = styled(Heading)<SectionTitleProps>`
    position: relative;

    ${props =>
        !props.isNoBorder &&
        `
        &:before {
            content: '';
            width: 100vw;
            position: absolute;
            top: -53px;
            left: 0;
            height: 1px;
            background-color: #3d3d3d;
        }
    `}

    @media (max-width: 768px) {
        &:before {
            width: calc(100vw - 60px);
        }
    }
`;

const NavStickyWrap = styled(WrapSticky)`
    padding-left: 60px;
    z-index: 15;

    @media (max-width: 768px) {
        display: none;
    }
`;

const ChapterLink = styled.a`
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
