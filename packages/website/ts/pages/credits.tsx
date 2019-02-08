import * as _ from 'lodash';
import { opacify } from 'polished';
import * as React from 'react';

import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { Action, Definition } from 'ts/components/definition';
import { Hero } from 'ts/components/hero';
import { ModalContact, ModalContactType } from 'ts/components/modals/modal_contact';
import { Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { colors } from 'ts/style/colors';
import { WebsitePaths } from 'ts/types';

interface OfferData {
    icon: string;
    title: string;
    description: string;
    links?: Action[];
}
export interface NextCreditsProps {}

export class NextCredits extends React.Component<NextCreditsProps> {
    public state = {
        isContactModalOpen: false,
    };

    private readonly _offersData: OfferData[];

    constructor(props: NextCreditsProps) {
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

    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <Hero
                    maxWidth="865px"
                    maxWidthHeading="715px"
                    isLargeTitle={false}
                    isFullWidth={false}
                    isCenteredMobile={false}
                    title="Earn free infrastructure credits when building on top of 0x"
                    description="0x has teamed up with a variety of service providers to offer free credits for any team working on 0x in a full time capacity."
                    actions={this._renderHeroActions()}
                />

                <Section bgColor="light" isFlex={true} maxWidth="1170px">
                </Section>

                <Banner
                    heading="Apply for the program now"
                    subline="Have Questions? Please join our Discord channel"
                    mainCta={{ text: 'Apply Now', onClick: this._onOpenContactModal }}
                    secondaryCta={{ text: 'Join Discord', href: 'https://discordapp.com/invite/d3FTX3M' }}
                />
                <ModalContact
                    isOpen={this.state.isContactModalOpen}
                    onDismiss={this._onDismissContactModal}
                    modalContactType={ModalContactType.MarketMaker}
                />
            </SiteWrap>
        );
    }

    private readonly _onOpenContactModal = (): void => {
        this.setState({ isContactModalOpen: true });
    };

    private readonly _onDismissContactModal = (): void => {
        this.setState({ isContactModalOpen: false });
    };

    private readonly _renderHeroActions = () => (
        <>
            <Button
                onClick={this._onOpenContactModal}
                bgColor="dark"
                isInline={true}
            >
                Apply Now
            </Button>
        </>
    );
}
