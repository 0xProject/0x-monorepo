import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Hero } from 'ts/components/hero';

import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { Card, LinkProps } from 'ts/components/card';
import { DocumentTitle } from 'ts/components/document_title';
import { Icon } from 'ts/components/icon';
import { SiteWrap } from 'ts/components/siteWrap';
import { WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';

import { documentConstants } from 'ts/utils/document_meta_constants';

import { ModalContact } from '../components/modals/modal_contact';

interface Extension {
    icon: string;
    title: string;
    description: string;
    links?: LinkProps[];
}

const extensionData: Extension[] = [
    {
        icon: 'dutchAuction',
        title: 'Dutch Auction',
        description: `Dutch Auctions continually reduce prices until a buyer is found. They're perfect for new or rare assets, and with 0x's off-chain model, they're gas-efficient as well.`,
        links: [
            {
                text: 'Explore the Docs',
                url: `${WebsitePaths.DocsGuides}/0x-extensions-explained`,
            },
        ],
    },
    {
        icon: 'forwarderContract',
        title: 'Forwarder Contract',
        description: `Say goodbye to WETH! The Forwarder Contract will automatically wrap ETH and fill orders, making buying assets on 0x one step simpler.`,
        links: [
            {
                text: 'Explore the Docs',
                url: 'https://0x.org/docs/guides/v2-forwarder-specification',
            },
        ],
    },
    {
        icon: 'whitelistFilter',
        title: 'Whitelist Filter',
        description: `Restrict access to your relayer with a Whitelist of approved traders. Bring your own list of addresses, or use Wyre's KYC list for free.`,
        links: [
            {
                text: 'Explore the Docs',
                url: `${WebsitePaths.DocsGuides}/0x-extensions-explained`,
            },
        ],
    },
];

interface Props {
    location: Location;
}

export class Extensions extends React.Component<Props> {
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
                <DocumentTitle {...documentConstants.EXTENSIONS} />
                <Hero
                    isLargeTitle={false}
                    isFullWidth={false}
                    title="0x Extensions"
                    description="Support new types of trading on your relayer with 0x Extensions"
                    figure={<Icon name="extensions" size="hero" margin={['small', 0, 'small', 0]} />}
                    actions={<HeroActions />}
                />

                <CustomSection>
                    <Grid>
                        {_.map(extensionData, (item, index) => (
                            <Card
                                key={`extensionCard-${index}`}
                                heading={item.title}
                                description={item.description}
                                icon={item.icon}
                                links={item.links}
                            />
                        ))}
                    </Grid>
                </CustomSection>

                <Banner
                    heading="Create your own 0x extension contracts"
                    subline="Developers can build custom extensions on 0x to add new modes of exchange"
                    mainCta={{
                        text: 'Get Started',
                        href: `${WebsitePaths.DocsGuides}/0x-extensions-explained`,
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
        <Button href={`${WebsitePaths.DocsGuides}/0x-extensions-explained`} isInline={true} target="_blank">
            Get Started
        </Button>

        <Button href={constants.URL_EXTENSIONS_BLOG_POST} isTransparent={true} isInline={true} target="_blank">
            Learn More!
        </Button>
    </React.Fragment>
);

const CustomSection = styled.div`
    width: calc(100% - 60px);
    max-width: 1500px;
    margin: 0 auto;
    padding: 0 0 60px;
    position: relative;

    @media (max-width: 768px) {
        padding: 0 0 40px;
    }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    grid-column-gap: 30px;
    grid-row-gap: 30px;

    @media (min-width: 500px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: 900px) {
        grid-template-columns: repeat(3, 1fr);
    }

    @media (min-width: 1560px) {
        padding: 0;
    }
`;
