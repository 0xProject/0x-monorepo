import * as React from 'react';
import styled from 'styled-components';

import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { Definition } from 'ts/components/definition';
import { DocumentTitle } from 'ts/components/document_title';
import { Hero } from 'ts/components/hero';
import { Icon, InlineIconWrap } from 'ts/components/icon';
import { Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { CFLMetrics } from 'ts/pages/cfl/cfl_metrics';
import { CodeStepper } from 'ts/pages/cfl/code_stepper';

import { colors } from 'ts/style/colors';
import { constants } from 'ts/utils/constants';
import { documentConstants } from 'ts/utils/document_meta_constants';

interface Props {
    theme: {
        bgColor: string;
        textColor: string;
        linkColor: string;
    };
}

const TerminalContainer = styled.div`
    font-size: 16px;
    color: ${colors.brandLight};
    position: relative;
    p {
        position: absolute;
        bottom: 23px;
        font-family: 'Roboto Mono';
        @media (max-width: 768px) {
            bottom: -7px;
            left: 20px;
        }
        @media (max-width: 375px) {
            font-size: 12px;
            bottom: 0px;
            left: 8px;
        }
    }
`;

const DeveloperLink = styled(Button)`
    @media (max-width: 500px) {
        && {
            white-space: pre-wrap;
            line-height: 1.3;
        }
    }
`;

const DeFiHeading = styled(Heading)`
    text-align: center;
    @media (min-width: 768px) {
        padding-bottom: 80px;
    }
    @media (max-width: 768px) {
        font-size: 34px !important;
        padding: 15px 0px;
    }
`;

const useCasesData = [
    {
        title: 'DeFi Lending and Margin Trading Platforms',
        icon: 'dydx_logo',
        description:
            'DeFi projects swap tokens through 0x to improve their UX by abstracting out required tokens, rebalancing user positions in real-time, and pre-baking terms of an asset sale into contracts so that they can be trustlessly executed in the future.',
        links: [
            {
                label: 'Explore Asset Swapper',
                url: constants.CFL_DOCS,
            },
            {
                label: `Learn about dYdX's integration`,
                url: constants.URL_DYDX_CASE_STUDY,
            },
        ],
    },
    {
        title: 'Crypto Algo Traders',
        icon: 'hummingbot',
        description:
            'Trading bots consume 0x liquidity to atomically swap tokens at tight spreads and perform risk-free arbitrage across both centralized and decentralized exchange venues.',
        links: [
            {
                label: 'Explore Asset Swapper',
                url: constants.CFL_DOCS,
            },
            {
                label: `Learn about Hummingbot's integration`,
                url: constants.URL_HUMMING_BOT_0X,
            },
        ],
    },
];

export class CFL extends React.Component<Props> {
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="dark">
                <DocumentTitle {...documentConstants.CFL} />
                <Hero
                    title="Swap tokens by tapping into 0x's networked liquidity"
                    isLargeTitle={false}
                    isFullWidth={true}
                    description="Source liquidity for your DeFi users by filling orders at the best prices"
                    showFigureBottomMobile={true}
                    isCenteredMobile={true}
                    figure={<CFLMetrics />}
                    figureMaxWidth="600px"
                    maxWidth="500px"
                    actions={
                        <Button href={constants.CFL_DOCS} isInline={true}>
                            Get Started
                        </Button>
                        // tslint:disable-next-line:jsx-curly-spacing
                    }
                />
                <Section bgColor="dark" isTextCentered={true}>
                    <InlineIconWrap>
                        <Icon name="descriptionFlask" size="small" />
                        <Icon name="standardForExchange" size="small" />
                        <Icon name="descriptionBolt" size="small" />
                    </InlineIconWrap>

                    <Paragraph size="large" isCentered={true} isMuted={1} padding={['large', 0, 'default', 0]}>
                        Use Asset Swapper to programmatically exchange assets with a single line of code or build custom
                        integrations for more advanced token trades.
                    </Paragraph>

                    <DeveloperLink href={constants.CFL_DOCS} isWithArrow={true} isAccentColor={true}>
                        Explore the docs
                    </DeveloperLink>
                </Section>
                <Section bgColor="dark" omitWrapper={true} isPadded={false}>
                    <CodeStepper />
                </Section>
                <Section>
                    <DeFiHeading size="medium">Use Cases in DeFi</DeFiHeading>
                    {useCasesData.map(useCase => (
                        <Definition
                            key={useCase.title}
                            icon={useCase.icon}
                            title={useCase.title}
                            description={useCase.description}
                            isInlineIcon={true}
                            iconSize={240}
                            actions={useCase.links}
                        />
                    ))}
                </Section>
                <Banner
                    heading="Ready to get started?"
                    subline="Dive into our docs, or use your terminal"
                    customCta={
                        <TerminalContainer>
                            <Icon name="asset_swapper_term" size="natural" />
                            <p>$ yarn install @0x/asset-swapper</p>
                        </TerminalContainer>
                    }
                />
            </SiteWrap>
        );
    }
}
