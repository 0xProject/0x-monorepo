import * as React from 'react';
import styled from 'styled-components';
import zenscroll from 'zenscroll';

import { colors } from 'ts/style/colors';

import { Banner } from 'ts/@next/components/banner';
import { Icon } from 'ts/@next/components/icon';
import { Column, Section, Wrap, WrapCentered, WrapSticky } from 'ts/@next/components/layout';
import { Link } from 'ts/@next/components/link';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Paragraph } from 'ts/@next/components/text';

import CoinIcon from 'ts/@next/icons/illustrations/coin.svg';
import CustomizeIcon from 'ts/@next/icons/illustrations/customize.svg';
import ProtocolIcon from 'ts/@next/icons/illustrations/protocol.svg';

export class NextWhy extends React.PureComponent {
    public scrollToSection = (sectionName: 'benefits' | 'cases' | 'features') => {
        zenscroll.to(this[sectionName]);
    }

    public scrollToBenefits = () => {
        // was going to onClick={() => this.scrollToSection('name')} but ts/linting
        // doesnt like it, lets do this for now
        this.scrollToSection('benefits');
    }

    public scrollToCases = () => {
        this.scrollToSection('cases');
    }

    public scrollToFunctionality = () => {
        this.scrollToSection('functionality');
    }

    public render(): React.ReactNode {
        return (
            <SiteWrap theme="dark">
              <Section isPadLarge={true}>
                <WrapCentered>
                  <Column colWidth="2/3">
                      <Heading
                          size="medium"
                          isCentered={true}
                      >
                          The exchange layer for the crypto economy
                      </Heading>

                      <Paragraph
                          size="medium"
                          isMuted={true}
                          isCentered={true}
                      >
                          The world's assets are becoming tokenized on public blockchains. 0x Protocol is free, open-source infrastructure that allows anyone in the world to build products that enable the purchasing and trading of crypto tokens.
                      </Paragraph>

                      <Link href="/docs" isCentered={true}>
                          Build on 0x
                      </Link>
                  </Column>
                </WrapCentered>
              </Section>

              <Section bgColor={colors.backgroundDark} isPadLarge={true}>
                <Wrap>
                  <Column colWidth="1/3">
                      <Icon name="coin" size="large" margin={[0, 0, 32, 0]} />
                      <Heading size="small">Support for all Ethereum Standards</Heading>
                      <Paragraph isMuted={true}>0x Protocol facilitates the decentralized exchange of a growing number of Ethereum-based tokens, including all ERC-20 and ERC-721 assets. Additional ERC standards can be added to the protocol...</Paragraph>
                  </Column>

                  <Column colWidth="1/3">
                      <Icon name="coin" size="large" margin={[0, 0, 32, 0]} />
                      <Heading size="small">Shared Networked Liquidity</Heading>
                      <Paragraph isMuted={true}>0x is building a layer of networked liquidity that will lower the barriers to entry. By enabling businesses to tap into a shared pool of digital assets, it will create a more stable financial system.</Paragraph>
                  </Column>

                  <Column colWidth="1/3">
                      <Icon name="coin" size="large" margin={[0, 0, 32, 0]} />
                      <Heading size="small">Customize the User Experience</Heading>
                      <Paragraph isMuted={true}>Relayers are businesses around the world that utilize 0x to integrate exchange functionality into a wide variety of products including order books, games, and digital art marketplaces.</Paragraph>
                  </Column>
                </Wrap>
              </Section>

              <Section>
                <Wrap>
                  <Column colWidth="1/3">
                      <WrapSticky>
                          <ChapterLink href="#" onClick={this.scrollToBenefits}>Benefits</ChapterLink>
                          <ChapterLink href="#" onClick={this.scrollToBenefits}>Use Cases</ChapterLink>
                          <ChapterLink href="#" onClick={this.scrollToBenefits}>Features</ChapterLink>
                      </WrapSticky>
                  </Column>

                  <Column colWidth="2/3">
                        <div ref={elem => this.benefits = elem}>
                            <Heading size="medium">What 0x offers</Heading>

                            <Icon name="coin" size="medium" margin={[0, 0, 22, 0]} />
                            <Heading size="small">A Standard for Exchange</Heading>
                            <Paragraph isMuted={true}>0x provides developers with a technical standard for trading Ethereum-based tokens such as ERC 20 and ERC 721.</Paragraph>

                            <Icon name="coin" size="medium" margin={[0, 0, 22, 0]} />
                            <Heading size="small">Robust Smart Contracts</Heading>
                            <Paragraph isMuted={true}>0x Protocol's smart contracts have been put through two rounds of rigorous security audits.</Paragraph>

                            <Icon name="coin" size="medium" margin={[0, 0, 22, 0]} />
                            <Heading size="small">Extensible Architecture</Heading>
                            <Paragraph isMuted={true}>0x's modular pipeline enables you to plug in your own smart contracts through an extensible API.</Paragraph>

                            <Icon name="coin" size="medium" margin={[0, 0, 22, 0]} />
                            <Heading size="small">Efficient Design</Heading>
                            <Paragraph isMuted={true}>0x’s off-chain order relay with on-chain settlement is a gas efficient approach to p2p exchange, reducing blockchain bloat.</Paragraph>
                        </div>

                        <div ref={elem => this.cases = elem}>
                            <Heading size="small">Use Cases</Heading>
                            <Paragraph isMuted={true}>slider</Paragraph>
                        </div>

                        <div ref={elem => this.functionality = elem}>
                            <Heading size="small">Exchange Functionality</Heading>

                            <Icon name="coin" size="medium" margin={[0, 0, 22, 0]} />
                            <Heading size="small">Secure Non-custodial Trading</Heading>
                            <Paragraph isMuted={true}>Enable tokens to be traded wallet-to-wallet with no deposits or withdrawals.</Paragraph>

                            <Icon name="coin" size="medium" margin={[0, 0, 22, 0]} />
                            <Heading size="small">Flexible Order Types</Heading>
                            <Paragraph isMuted={true}>Choose to sell assets at a specific “buy it now” price or allow potential buyers to submit bids.</Paragraph>

                            <Icon name="coin" size="medium" margin={[0, 0, 22, 0]} />
                            <Heading size="small">Build a Business</Heading>
                            <Paragraph isMuted={true}>Monetize your product by taking fees on each transaction and join a growing number of relayers in the 0x ecosystem.</Paragraph>

                            <Icon name="coin" size="medium" margin={[0, 0, 22, 0]} />
                            <Heading size="small">Networked Liquidity</Heading>
                            <Paragraph isMuted={true}>Allow your assets to appear on other 0x-based marketplaces by sharing your liquidity through an open order book.</Paragraph>
                        </div>
                  </Column>
                </Wrap>
              </Section>

              <Banner
                heading="Ready to get started?"
                subline="Dive into our docs, or contact us if needed"
                mainCta={{ text: 'Get Started', href: '/docs' }}
                secondaryCta={{ text: 'Get in Touch', href: '/contact' }}
              />
            </SiteWrap>
        );
    }
}

const StickyColumn = styled(Column)`
    position: sticky;
`;

const ChapterLink = styled.a`
    color: ${props => props.theme.textColor};
    font-size: 22px;
    margin-bottom: 15px;
    display: block;
    opacity: 0.8;

    &:hover {
        opacity: 1;
    }
`;
