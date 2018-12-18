import * as _ from 'lodash';
import * as React from 'react';

import { colors } from 'ts/style/colors';

import { Banner } from 'ts/@next/components/banner';
import { Button } from 'ts/@next/components/button';
import { Definition } from 'ts/@next/components/definition';
import { Hero } from 'ts/@next/components/hero';
import { Icon } from 'ts/@next/components/icon';
import { SiteWrap } from 'ts/@next/components/siteWrap';

import { ModalContact } from 'ts/@next/components/modals/modal_contact';
import { Section } from 'ts/@next/components/newLayout';

import { WebsitePaths } from 'ts/types';

const offersData = [
    {
        icon: 'supportForAllEthereumStandards',
        title: 'Comprehensive Tutorials',
        description:
            'Stay on the bleeding edge of crypto by learning how to market make on decentralized exchanges. The network of 0x relayers provides market makers a first-mover advantage to capture larger spreads, arbitrage markets, and access a long-tail of new tokens not currently listed on centralized exchanges.',
    },
    {
        icon: 'generateRevenueForYourBusiness-large',
        title: 'Market Making Compensation',
        description: (
            <ul>
                <li>Receive an infrastructure grant of $20,000+ for completing onboarding*</li>
                <li>Earn an additional $5,000 by referring other market makers to the Program*</li>
            </ul>
        ),
    },
    {
        icon: 'getInTouch',
        title: 'Personalized Support',
        description:
            'The 0x MM Success Manager will walk you through how to read 0x order types, spin up an Ethereum node, set up your MM bot, and execute trades on the blockchain. We are more than happy to promptly answer your questions and give you complete onboarding assistance.',
    },
];

export class NextMarketMaker extends React.Component {
    public state = {
        isContactModalOpen: false,
    };
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <Hero
                    maxWidth="865px"
                    maxWidthHeading="715px"
                    isLargeTitle={false}
                    isFullWidth={false}
                    isCenteredMobile={false}
                    title="Bring liquidity to the exchanges of the future"
                    description="Market makers (MMs) are important stakeholders in the 0x ecosystem. The Market Making Program provides a set of resources that help onboard MMs bring liquidity to the 0x network. The program includes tutorials, a robust data platform, trade compensation, and 1:1 support from our MM Success Manager."
                    actions={<HeroActions />}
                />

                <Section bgColor="light" isFlex={true} maxWidth="1170px">
                    <Definition
                        title="Secure"
                        titleSize="small"
                        description="Take full custody of your assets to eliminate counterparty risk"
                        icon="secureTrading"
                        iconSize="medium"
                        isInline={true}
                    />

                    <Definition
                        title="Networked Liquidity Pool"
                        titleSize="small"
                        description="Use one pool of capital across multiple relayers to trade against a large group of takers"
                        icon="networkedLiquidity"
                        iconSize="medium"
                        isInline={true}
                    />

                    <Definition
                        title="Low Cost"
                        titleSize="small"
                        description="Pay no fees on orders except for bulk cancellations"
                        icon="low-cost"
                        iconSize="medium"
                        isInline={true}
                    />
                </Section>

                <Section>
                    {_.map(offersData, (item, index) => (
                        <Definition
                            key={`offers-${index}`}
                            icon={item.icon}
                            title={item.title}
                            description={item.description}
                            isInlineIcon={true}
                            iconSize={240}
                            fontSize="medium"
                        />
                    ))}
                </Section>

                <Banner
                    heading="Need more flexibility?"
                    subline="Dive into our docs, or contact us if needed"
                    mainCta={{ text: 'Explore the Docs', href: '/docs' }}
                    secondaryCta={{ text: 'Get in Touch', onClick: this._onOpenContactModal.bind(this) }}
                />
                <ModalContact isOpen={this.state.isContactModalOpen} onDismiss={this._onDismissContactModal} />
            </SiteWrap>
        );
    }

    public _onOpenContactModal = (): void => {
        this.setState({ isContactModalOpen: true });
    };

    public _onDismissContactModal = (): void => {
        this.setState({ isContactModalOpen: false });
    };
}

const HeroActions = () => (
    <>
        <Button href="https://github.com/0xProject/0x-launch-kit" bgColor="dark" isInline={true}>
            Get Started
        </Button>
    </>
);
