import * as _ from 'lodash';
import * as React from 'react';
import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { Definition } from 'ts/components/definition';
import { DocumentTitle } from 'ts/components/document_title';
import { Hero } from 'ts/components/hero';
import { Icon } from 'ts/components/icon';
import { Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { constants } from 'ts/utils/constants';
import { documentConstants } from 'ts/utils/document_meta_constants';

import { ModalContact } from '../components/modals/modal_contact';

const offersData = [
    {
        icon: 'supportForAllEthereumStandards',
        title: 'Perfect for developers who need a simple drop-in marketplace',
        description: (
            <ul>
                <li>Quickly launch a market for your project’s token</li>
                <li>Seamlessly create an in-game marketplace for digital items and collectables</li>
                <li>Easily build a 0x relayer for your local market</li>
            </ul>
        ),
    },
];

interface Props {
    location: Location;
}

export class NextLaunchKit extends React.Component<Props> {
    public state = {
        isContactModalOpen: false,
    };
    public componentDidMount(): void {
        if (this.props.location.hash.includes('contact')) {
            this._onOpenContactModal();
        }
    }
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="dark">
                <DocumentTitle {...documentConstants.LAUNCH_KIT} />
                <Hero
                    isLargeTitle={false}
                    isFullWidth={false}
                    title="0x Launch Kit"
                    description="Launch a relayer in under a minute"
                    figure={<Icon name="launchKit" size="hero" margin={['small', 0, 'small', 0]} />}
                    actions={<HeroActions />}
                />

                <Section bgColor="dark" isFlex={true} maxWidth="1170px">
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
                    mainCta={{
                        text: 'Get Started',
                        href: `${constants.URL_LAUNCH_KIT}/#table-of-contents`,
                        shouldOpenInNewTab: true,
                    }}
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

const HeroActions = () => (
    <React.Fragment>
        <Button href={constants.URL_LAUNCH_KIT} isInline={true} target="_blank">
            Get Started
        </Button>

        <Button href={constants.URL_LAUNCH_KIT_BLOG_POST} isTransparent={true} isInline={true} target="_blank">
            Learn More!
        </Button>
    </React.Fragment>
);
