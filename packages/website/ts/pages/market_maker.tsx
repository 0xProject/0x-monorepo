import * as _ from 'lodash';
import * as React from 'react';

import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { Definition } from 'ts/components/definition';
import { Hero } from 'ts/components/hero';
import { ModalContact } from 'ts/components/modals/modal_contact';
import { Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { WebsitePaths } from 'ts/types';

const offersData = [
    {
        icon: 'supportForAllEthereumStandards',
        title: 'Comprehensive Tutorials',
        description:
            'Stay on the bleeding edge of crypto by learning how to market make on decentralized exchanges. The network of 0x relayers provides market makers a first-mover advantage to capture larger spreads, find arbitrage opportunities, and trade on new types of exchanges like prediction markets and non-fungible token marketplaces.',
        links: [
            {
                label: 'Explore the Docs',
                url: `${WebsitePaths.Wiki}#Market-Making-on-0x`,
            },
        ],
    },
    {
        icon: 'generateRevenueForYourBusiness-large',
        title: 'Market Making Compensation',
        description: 'Accepted applicants can receive up to $15,000 for completing onboarding',
    },
    {
        icon: 'getInTouch',
        title: 'Dedicated Support',
        description:
            'The 0x team will provide 1:1 onboarding assistance and promptly answer all your questions. They will walk you through the tutorials so that you know how to read 0x order types, spin up an Ethereum node, and execute trades on the blockchain.',
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
                    description="Market makers (MMs) are important stakeholders in the 0x ecosystem. The Market Making Program provides a set of resources that help onboard MMs to bring liquidity to the 0x network. The Program includes tutorials, monetary incentives, and 1:1 support from the 0x team."
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
                        description="Pay no fees to make or take orders."
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
                            actions={item.links}
                        />
                    ))}
                </Section>

                <Banner
                    heading="Start trading today."
                    subline="Dive into our docs, or contact us if needed"
                    mainCta={{ text: 'Explore the Docs', href: `${WebsitePaths.Wiki}#Market-Making-on-0x` }}
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
        <Button href={`${WebsitePaths.Wiki}#Market-Making-on-0x`} bgColor="dark" isInline={true}>
            Get Started
        </Button>
    </>
);
