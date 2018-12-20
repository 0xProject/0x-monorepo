import { utils as sharedUtils } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import styled, { keyframes } from 'styled-components';

import { Banner } from 'ts/@next/components/banner';
import { Button } from 'ts/@next/components/button';
import { Definition } from 'ts/@next/components/definition';
import { Hero } from 'ts/@next/components/hero';
import { Section, SectionProps } from 'ts/@next/components/newLayout';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Paragraph } from 'ts/@next/components/text';
import { Configurator } from 'ts/@next/pages/instant/configurator';
import { colors } from 'ts/style/colors';
import { WebsitePaths } from 'ts/types';
import { utils } from 'ts/utils/utils';

import { ModalContact } from '../components/modals/modal_contact';

const CONFIGURATOR_MIN_WIDTH_PX = 1050;

export const getStartedClick = () => {
    if (window.innerWidth < CONFIGURATOR_MIN_WIDTH_PX) {
        utils.openUrl(`${WebsitePaths.Wiki}#Get-Started-With-Instant`);
    } else {
        sharedUtils.setUrlHash('configurator');
        sharedUtils.scrollToHash('configurator', '');
    }
};

const featuresData = [
    {
        title: 'Support ERC-20 and ERC-721 tokens',
        icon: 'supportForAllEthereumStandards-large',
        description:
            'Seamlessly integrate token purchasing into your product experience by offering digital assets ranging from in-game items to stablecoins.',
        links: [
            {
                label: 'Get Started',
                onClick: getStartedClick,
                shouldUseAnchorTag: true,
            },
            {
                label: 'Explore the Docs',
                url: `${WebsitePaths.Wiki}#Get-Started-With-Instant`,
            },
        ],
    },
    {
        title: 'Generate revenue for your business',
        icon: 'generateRevenueForYourBusiness-large',
        description:
            'With just a few lines of code, you can earn up to 5% in affiliate fees on every transaction from your crypto wallet or dApp.',
        links: [
            {
                label: 'Learn about affiliate fees',
                url: `${WebsitePaths.Wiki}#Learn-About-Affiliate-Fees`,
            },
        ],
    },
    {
        title: 'Easy and flexible integration',
        icon: 'flexibleIntegration0xInstant',
        description:
            'Use our out-of-the-box design or customize the user interface by integrating via the AssetBuyer engine.. You can also tap into 0x networked liquidity or choose your own liquidity pool.',
        links: [
            {
                label: 'Explore AssetBuyer',
                url: `${WebsitePaths.Docs}/asset-buyer`,
            },
        ],
    },
];

interface Props {
    theme: {
        bgColor: string;
        textColor: string;
        linkColor: string;
    };
}

export class Next0xInstant extends React.Component<Props> {
    public state = {
        isContactModalOpen: false,
    };
    public render(): React.ReactNode {
        return (
            <SiteWrap>
                <DocumentTitle title="0x Instant: Quick and secure crypto purchasing" />
                <Hero
                    title="Introducing 0x Instant"
                    description="A free and flexible way to offer simple crypto purchasing in any app or website"
                    actions={<Button onClick={getStartedClick}>Get Started</Button>}
                />

                <Section isFullWidth={true} isPadded={false} padding="30px 0">
                    <MarqueeWrap>
                        <div>
                            {[...Array(18)].map((item, index) => (
                                <Card key={`card-${index}`} index={index}>
                                    <img src={`/images/@next/0x-instant/widget-${index % 6 + 1}.png`} />
                                </Card>
                            ))}
                        </div>
                    </MarqueeWrap>
                </Section>

                <Section>
                    {_.map(featuresData, (item, index) => (
                        <Definition
                            key={`definition-${index}`}
                            icon={item.icon}
                            title={item.title}
                            description={item.description}
                            isInlineIcon={true}
                            iconSize={240}
                            actions={item.links}
                        />
                    ))}
                </Section>

                <ConfiguratorSection
                    id="configurator"
                    maxWidth="1386px"
                    padding="0 58px 70px"
                    bgColor={colors.backgroundDark}
                >
                    <Heading>0x Instant Configurator</Heading>
                    <Configurator />
                </ConfiguratorSection>

                <Banner
                    heading="Need more flexibility?"
                    subline="Dive into our docs, or contact us if needed"
                    mainCta={{ text: 'Explore the Docs', href: `${WebsitePaths.Wiki}#Get-Started-With-Instant` }}
                    secondaryCta={{ text: 'Get in Touch', onClick: this._onOpenContactModal.bind(this) }}
                />
                <ModalContact isOpen={this.state.isContactModalOpen} onDismiss={this._onDismissContactModal} />

                <Section maxWidth="1170px" isPadded={false} padding="60px 0">
                    <Paragraph size="small" isMuted={0.5}>
                        Disclaimer: The laws and regulations applicable to the use and exchange of digital assets and
                        blockchain-native tokens, including through any software developed using the licensed work
                        created by ZeroEx Intl. (the “Work”), vary by jurisdiction. As set forth in the Apache License,
                        Version 2.0 applicable to the Work, developers are “solely responsible for determining the
                        appropriateness of using or redistributing the Work,” which includes responsibility for ensuring
                        compliance with any such applicable laws and regulations.
                    </Paragraph>
                    <Paragraph size="small" isMuted={0.5}>
                        See the Apache License, Version 2.0 for the specific language governing all applicable
                        permissions and limitations.
                    </Paragraph>
                </Section>
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

// scroll animation calc is simply (imageWidth * totalRepetitions) / 2
// img width is 370px
const scroll = keyframes`
    0% { transform: translate3d(-2220px, 0, 0) }
    100% { transform: translate3d(-4440px, 0, 0) }
`;

const scrollMobile = keyframes`
    0% { transform: translate3d(0, 0, 0) }
    100% { transform: translate3d(-1800px, 0, 0) }
`;

const fadeUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(50px);
  }
  100% {
    opacity: 1;
    transform: translateY(0px);
  }
`;

const ConfiguratorSection =
    styled(Section) <
    SectionProps >
    `
  @media (max-width: ${CONFIGURATOR_MIN_WIDTH_PX}px) {
      display: none;
  }
`;

// width = 370 * 12
// mobile width = 300
const MarqueeWrap = styled.div`
    width: 100vw;
    height: 514px;
    padding-bottom: 60px;

    @media (max-width: 768px) {
        width: calc(100% + 60px);
        margin-left: -30px;
        overflow: hidden;
    }

    > div {
        height: auto;
        display: flex;
        will-change: transform;
        transform: translate3d(-2220px, 0, 0);
    }

    @media (min-width: 768px) {
        > div {
            width: 6660px;
            animation: ${scroll} 70s linear infinite;
        }
    }

    @media (max-width: 768px) {
        > div {
            width: 5400px;
            animation: ${scrollMobile} 70s linear infinite;
        }
    }
`;

const Card =
    styled.div <
    { index: number } >
    `
  opacity: 0;
  flex-shrink: 0;
  transform: translateY(10px);
  will-change: opacity, transform;
  animation: ${fadeUp} 0.75s ${props => `${props.index * 0.05}s`} forwards;

  img {
    height: auto;
  }

  @media (min-width: 768px) {
    img {
      width: 370px;
    }
  }

  @media (max-width: 768px) {
    img {
      width: 300px;
    }
  }
`;
