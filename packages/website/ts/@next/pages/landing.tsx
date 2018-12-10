import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import {colors} from 'ts/style/colors';

import {Button, ButtonWrap} from 'ts/@next/components/button';
import {Icon, InlineIconWrap} from 'ts/@next/components/icon';
import {Column, Section, Wrap, WrapCentered, WrapGrid} from 'ts/@next/components/layout';
import {SiteWrap} from 'ts/@next/components/siteWrap';
import {Heading, Paragraph} from 'ts/@next/components/text';

import LogoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';
import ProtocolIcon from 'ts/@next/icons/illustrations/protocol.svg';
import ReadyToBuildIcon from 'ts/@next/icons/illustrations/ready-to-build.svg';
import SupportIcon from 'ts/@next/icons/illustrations/support.svg';

interface ProjectLogo {
    name: string;
    imageUrl?: string;
}

const projects: ProjectLogo[] = [
    {
        name: 'Radar Relay',
        imageUrl: '/images/@next/relayer-logos/logo_1.png',
    },
    {
        name: 'Paradex',
        imageUrl: '/images/@next/relayer-logos/logo_5.png',
    },
    {
        name: 'Amadeus',
        imageUrl: '/images/@next/relayer-logos/logo_3.png',
    },
    {
        name: 'The Ocean X',
        imageUrl: '/images/@next/relayer-logos/logo_4.png',
    },
    {
        name: 'Paradex',
        imageUrl: '/images/@next/relayer-logos/logo_5.png',
    },
    {
        name: 'Decent EX',
        imageUrl: '/images/@next/relayer-logos/logo_2.1.png',
    },
    {
        name: 'dEX',
        imageUrl: '/images/@next/relayer-logos/logo_2.2.png',
    },
    {
        name: 'OpenRelay',
        imageUrl: '/images/@next/relayer-logos/logo_2.3.png',
    },
    {
        name: 'DDEX',
        imageUrl: '/images/@next/relayer-logos/logo_2.png',
    },
];

export const NextLanding: React.StatelessComponent<{}> = () => (
    <SiteWrap theme="dark">
        <Section>
            <Wrap>
                <Column colWidth="1/2">
                    <Heading size="large">
                        Powering Decentralized Exchange
                    </Heading>

                    <Paragraph size="medium" isMuted={true}>
                        0x is the best solution for adding<br />
                        exchange functionality to your business.
                    </Paragraph>

                    <ButtonWrap>
                        <Button isInline={true}>
                            Get Started
                        </Button>

                        <Button isTransparent={true} isInline={true}>
                            Learn More
                        </Button>
                    </ButtonWrap>
                </Column>

                <Column colWidth="1/2">
                    <WrapCentered>
                        <LogoOutlined/>
                    </WrapCentered>
                </Column>
            </Wrap>
        </Section>

        <Section bgColor={colors.backgroundDark} isPadLarge={true}>
            <WrapCentered width="narrow">
                <InlineIconWrap>
                    <Icon name="coin" size="small" />
                    <Icon name="coin" size="small" />
                    <Icon name="coin" size="small" />
                    <Icon name="coin" size="small" />
                </InlineIconWrap>

                <Paragraph
                    size="large"
                    isCentered={true}
                    padding={['large', 0, 'default', 0]}
                >
                    0x is an open protocol that enables the peer-to-peer exchange of Ethereum-based
                    tokens. Anyone in the world can use 0x to service a wide variety of markets
                    ranging from gaming items to financial instruments to assets that could have
                    near existed before.
                </Paragraph>

                <Button href="#" isTransparent={true}>
                    Discover how developers use 0x
                </Button>
            </WrapCentered>

            {/* Note you can also pass in a string "large/default" or a number for custom margins */}
            <Wrap padding={['large', 0, 0, 0]}>
                {/* NOTE: this probably should be withComponent as part of a <dl> */}
                <Column colWidth="1/3" isNoPadding={true}>
                    <Heading
                        size="medium"
                        isCentered={true}
                        isNoMargin={true}
                    >
                        873,435
                    </Heading>

                    <Paragraph
                        isMuted={0.4}
                        isCentered={true}
                        isNoMargin={true}
                    >
                        Number of transactions
                    </Paragraph>
                </Column>

                <Column colWidth="1/3" isNoPadding={true}>
                    <Heading
                        size="medium"
                        isCentered={true}
                        isNoMargin={true}
                    >
                        $203M
                    </Heading>

                    <Paragraph
                        isMuted={0.4}
                        isCentered={true}
                        isNoMargin={true}
                    >
                        Total volume
                    </Paragraph>
                </Column>

                <Column colWidth="1/3" isNoPadding={true}>
                    <Heading
                        size="medium"
                        isCentered={true}
                        isNoMargin={true}
                    >
                        227,372
                    </Heading>

                    <Paragraph
                        isMuted={0.4}
                        isCentered={true}
                        isNoMargin={true}
                    >
                        Number of relayers
                    </Paragraph>
                </Column>
            </Wrap>
        </Section>

        <Section isPadLarge={true}>
            <WrapCentered>
                <Heading size="small">You're in good company</Heading>
            </WrapCentered>

            <WrapGrid width="narrow" isWrapped={true}>
                {_.map(projects, (item: ProjectLogo, index) => (
                    <Project
                        key={index}
                        name={item.name}
                        imageUrl={item.imageUrl}
                    />
                ))}
            </WrapGrid>
        </Section>

        <Section>
            <Wrap>
                <Column
                    bgColor="#003831"
                    colWidth="1/2"
                    isPadLarge={true}
                >
                    <WrapCentered>
                        <ReadyToBuildIcon width="150" />

                        <Paragraph>
                            Ready to build on 0x?
                        </Paragraph>

                        <Button isTransparent={true}>
                            Get Started
                        </Button>
                    </WrapCentered>
                </Column>

                <Column
                    bgColor="#003831"
                    colWidth="1/2"
                    isPadLarge={true}
                >
                    <WrapCentered>
                        <SupportIcon width="150" />

                        <Paragraph>
                            Want help from the 0x team?
                        </Paragraph>

                        <Button isTransparent={true}>
                            Get in Touch
                        </Button>
                    </WrapCentered>
                </Column>
            </Wrap>
        </Section>
    </SiteWrap>
);

const Project = ({ name, imageUrl }: ProjectLogo) => (
    <StyledProject>
        <img src={imageUrl} alt={name} />
    </StyledProject>
);

const StyledProject = styled.div`
    width: 90px;
    height: 90px;
    flex-shrink: 0;
    margin: 30px;

    img {
        object-fit: contain;
        width: 100%;
        height: 100%;
    }
`;
