import * as _ from 'lodash';
import * as React from 'react';
import AnchorLink from 'react-anchor-link-smooth-scroll';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import {Hero} from 'ts/@next/components/hero';

import { Banner } from 'ts/@next/components/banner';
import { Button } from 'ts/@next/components/button';
import { Icon } from 'ts/@next/components/icon';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Slide, Slider } from 'ts/@next/components/slider/slider';
import { Heading, Paragraph } from 'ts/@next/components/text';

import {Definition} from 'ts/@next/components/definition';
import {Column, Section, WrapSticky} from 'ts/@next/components/newLayout';

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

export class NextLaunchKit extends React.PureComponent {
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="dark">
                <Hero
                    title="0x Launch Kit"
                    description="Launch a relayer in under a minute"
                    figure={<Icon name="launchKit_versionB" size="hero" />}
                    actions={<HeroActions/>}
                />

                <Section
                    bgColor="dark"
                    isFlex={true}
                    maxWidth="1170px"
                >
                    <Definition
                        title="Networked Liquidity Pool"
                        description="Tap into and share liquidity with other relayers"
                        icon="supportForAllEthereumStandards"
                        iconSize="large"
                        isInline={true}
                    />

                    <Definition
                        title="Extensible Code Repo"
                        description="Fork and extend to support modes of exchange"
                        icon="networkedLiquidity"
                        iconSize="large"
                        isInline={true}
                    />

                    <Definition
                        title="Exchange Ethereum based Tokens"
                        description="Enable trading for any ERC-20 or ERC-721 asset"
                        icon="flexibleIntegration"
                        iconSize="large"
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
                        isWithMargin={true}
                    />
                ))}
                </Section>

                <Banner
                    heading="Need more flexibility?"
                    subline="Dive into our docs, or contact us if needed"
                    mainCta={{ text: 'Get Started', href: '/docs' }}
                    secondaryCta={{ text: 'Get in Touch', href: '/contact' }}
                />
            </SiteWrap>
        );
    }
}

const HeroActions = () => (
    <>
        <Button href="https://0xproject.com/docs" isInline={true}>
            Get Started
        </Button>

        <Button to="/next/why" isTransparent={true} isInline={true}>
            Learn More
        </Button>
    </>
);

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
    z-index: 15;

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
