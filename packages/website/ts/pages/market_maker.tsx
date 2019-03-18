import * as _ from 'lodash';
import { opacify } from 'polished';
import * as React from 'react';

import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { Action, Definition } from 'ts/components/definition';
import { DocumentTitle } from 'ts/components/document_title';
import { Hero } from 'ts/components/hero';
import { ModalContact, ModalContactType } from 'ts/components/modals/modal_contact';
import { Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { colors } from 'ts/style/colors';
import { WebsitePaths } from 'ts/types';
import { documentConstants } from 'ts/utils/document_meta_constants';

interface OfferData {
    icon: string;
    title: string;
    description: string;
    links?: Action[];
}

interface NextMarketMakerProps {
    location: Location;
}

export class NextMarketMaker extends React.Component<NextMarketMakerProps> {
    public state = {
        isContactModalOpen: false,
    };

    private readonly _offersData: OfferData[];

    constructor(props: NextMarketMakerProps) {
        super(props);
        this._offersData = [
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
                links: [
                    {
                        label: 'Contact Us',
                        onClick: this._onOpenContactModal,
                        shouldUseAnchorTag: true,
                    },
                ],
            },
        ];
    }
    public componentDidMount(): void {
        if (this.props.location.hash.includes('contact')) {
            this._onOpenContactModal();
        }
    }
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <DocumentTitle {...documentConstants.MARKET_MAKER_PROGRAM} />
                <Hero
                    maxWidth="865px"
                    maxWidthHeading="715px"
                    isLargeTitle={false}
                    isFullWidth={false}
                    isCenteredMobile={false}
                    title="Bring liquidity to the markets of the future"
                    description="Market makers (MMs) are important stakeholders in the 0x ecosystem. The Market Making Program provides a set of resources that help onboard MMs to bring liquidity to the 0x network. The Program includes tutorials, monetary incentives, and 1:1 support from the 0x team."
                    actions={this._renderHeroActions()}
                />

                <Section bgColor="light" isFlex={true} maxWidth="1170px">
                    <Definition
                        title="Secure Trading"
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
                        description="Pay no gas fees to make 0x orders"
                        icon="low-cost"
                        iconSize="medium"
                        isInline={true}
                    />
                </Section>

                <Section>
                    {_.map(this._offersData, (item, index) => (
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
                    subline="Check out our Market Making tutorials to get started"
                    mainCta={{ text: 'Tutorials', href: `${WebsitePaths.Wiki}#Market-Making-on-0x` }}
                    secondaryCta={{ text: 'Apply Now', onClick: this._onOpenContactModal }}
                />
                <ModalContact
                    isOpen={this.state.isContactModalOpen}
                    onDismiss={this._onDismissContactModal}
                    modalContactType={ModalContactType.MarketMaker}
                />
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

    private readonly _renderHeroActions = () => (
        <>
            <Button href={`${WebsitePaths.Wiki}#Market-Making-on-0x`} bgColor="dark" isInline={true}>
                Get Started
            </Button>
            <Button
                onClick={this._onOpenContactModal}
                borderColor={opacify(0.4)(colors.brandDark)}
                isTransparent={true}
                isInline={true}
            >
                Apply Now
            </Button>
        </>
    );

}
