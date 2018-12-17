import * as _ from 'lodash';
import * as React from 'react';

import {Hero} from 'ts/@next/components/hero';

import { Banner } from 'ts/@next/components/banner';
import { Button } from 'ts/@next/components/button';
import { Definition } from 'ts/@next/components/definition';
import { Icon } from 'ts/@next/components/icon';
import { SiteWrap } from 'ts/@next/components/siteWrap';

import {Section} from 'ts/@next/components/newLayout';
import { ModalContact } from '../components/modals/modal_contact';

import { WebsitePaths } from 'ts/types';

const offersData = [
    {
        icon: 'supportForAllEthereumStandards',
        title: 'Perfect for developers who need a simple drop-in marketplace',
        description: (
            <ul>
                <li>
                    Quickly launch a market for your project’s token
                </li>
                <li>
                    Seamlessly create an in-game marketplace for digital items and collectables
                </li>
                <li>
                    Easily build a 0x relayer for your local market
                </li>
            </ul>
        ),
    },
];

export class NextLaunchKit extends React.Component {
    public state = {
        isContactModalOpen: false,
    };
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="dark">
                <Hero
                    isLargeTitle={false}
                    isFullWidth={false}
                    title="0x Launch Kit"
                    description="Launch a relayer in under a minute"
                    figure={<Icon name="launchKit" size="hero" margin={['small', 0, 'small', 0]} />}
                    actions={<HeroActions/>}
                />

                <Section
                    bgColor="dark"
                    isFlex={true}
                    maxWidth="1170px"
                >
                    <Definition
                        title="Networked Liquidity Pool"
                        titleSize="small"
                        description="Tap into and share liquidity with other relayers"
                        icon="networkedLiquidity"
                        iconSize="medium"
                        isInline={true}
                    />

                    <Definition
                        title="Extensible Code Repo"
                        titleSize="small"
                        description="Fork and extend to support modes of exchange"
                        icon="code-repo"
                        iconSize="medium"
                        isInline={true}
                    />

                    <Definition
                        title="Exchange Ethereum based Tokens"
                        titleSize="small"
                        description="Enable trading for any ERC-20 or ERC-721 asset"
                        icon="eth-based-tokens"
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
                    />
                ))}
                </Section>

                <Banner
                    heading="Need more flexibility?"
                    subline="Dive into our docs, or contact us if needed"
                    mainCta={{ text: 'Get Started', href: '/docs' }}
                    secondaryCta={{ text: 'Get in Touch', href: this._onOpenContactModal.bind(this) }}
                />
                <ModalContact isOpen={this.state.isContactModalOpen} onDismiss={this._onDismissContactModal} />
            </SiteWrap>
        );
    }

    public _onOpenContactModal = (): void => {
        this.setState({ isContactModalOpen: true });
    }

    public _onDismissContactModal = (): void => {
        this.setState({ isContactModalOpen: false });
    }
}

const HeroActions = () => (
    <>
        <Button href="https://github.com/0xProject/0x-launch-kit" isInline={true}>
            Get Started
        </Button>

        <Button to={WebsitePaths.Why} isTransparent={true} isInline={true}>
            Learn More
        </Button>
    </>
);
