import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Column, Section, Wrap, WrapCentered } from 'ts/@next/components/layout';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Paragraph } from 'ts/@next/components/text';

import CoinIcon from 'ts/@next/icons/illustrations/coin.svg';
import CustomizeIcon from 'ts/@next/icons/illustrations/customize.svg';
import ProtocolIcon from 'ts/@next/icons/illustrations/protocol.svg';

export const NextWhy = () => (
  <SiteWrap>
    <Section>
      <WrapCentered>
        <Column colWidth="2/3">
          <Heading size="medium" isCentered={true}>The exchange layer for the crypto economy</Heading>
          <Paragraph size="medium" isCentered={true}>The world's assets are becoming tokenized on public blockchains. 0x Protocol is free, open-source infrastructure that allows anyone in the world to build products that enable the purchasing and trading of crypto tokens.</Paragraph>
          <Paragraph isCentered={true}>Build on 0x (arrow)</Paragraph>
        </Column>
      </WrapCentered>
    </Section>

    <Section bgColor={colors.backgroundDark}>
      <Wrap>
        <Column colWidth="1/3">
            <ProtocolIcon width="150" />
            <Heading>Support for all Ethereum Standards</Heading>
            <Paragraph>0x Protocol facilitates the decentralized exchange of a growing number of Ethereum-based tokens, including all ERC-20 and ERC-721 assets. Additional ERC standards can be added to the protocol...</Paragraph>
        </Column>

        <Column colWidth="1/3">
            <ProtocolIcon width="150" />
            <Heading>Shared Networked Liquidity</Heading>
            <Paragraph>0x is building a layer of networked liquidity that will lower the barriers to entry. By enabling businesses to tap into a shared pool of digital assets, it will create a more stable financial system.</Paragraph>
        </Column>

        <Column colWidth="1/3">
            <CustomizeIcon width="150" />
            <Heading>Customize the User Experience</Heading>
            <Paragraph>Relayers are businesses around the world that utilize 0x to integrate exchange functionality into a wide variety of products including order books, games, and digital art marketplaces.</Paragraph>
        </Column>
      </Wrap>
    </Section>

    <Section>
      <Wrap>
        <Column colWidth="1/3">
            <ChapterLink href="#">Benefits</ChapterLink>
            <ChapterLink href="#">Use Cases</ChapterLink>
            <ChapterLink href="#">Features</ChapterLink>
        </Column>

        <Column colWidth="2/3">
          <Heading size="medium">What 0x offers</Heading>
          <CoinIcon width="150" />
          <Heading>A Standard for Exchange</Heading>
          <Paragraph isMuted={true}>0x provides developers with a technical standard for trading Ethereum-based tokens such as ERC 20 and ERC 721.</Paragraph>

          <CoinIcon width="150" />
          <Heading>Robust Smart Contracts</Heading>
          <Paragraph isMuted={true}>0x Protocol's smart contracts have been put through two rounds of rigorous security audits.</Paragraph>

          <CoinIcon width="150" />
          <Heading>Extensible Architecture</Heading>
          <Paragraph isMuted={true}>0x's modular pipeline enables you to plug in your own smart contracts through an extensible API.</Paragraph>

          <CoinIcon width="150" />
          <Heading>Efficient Design</Heading>
          <Paragraph isMuted={true}>0x’s off-chain order relay with on-chain settlement is a gas efficient approach to p2p exchange, reducing blockchain bloat.</Paragraph>

          <Heading size="medium">Use Cases</Heading>
          <Paragraph isMuted={true}>slider</Paragraph>

          <Heading size="medium">Exchange Functionality</Heading>

          <CoinIcon width="150" />
          <Heading>Secure Non-custodial Trading</Heading>
          <Paragraph isMuted={true}>Enable tokens to be traded wallet-to-wallet with no deposits or withdrawals.</Paragraph>

          <CoinIcon width="150" />
          <Heading>Flexible Order Types</Heading>
          <Paragraph isMuted={true}>Choose to sell assets at a specific “buy it now” price or allow potential buyers to submit bids.</Paragraph>

          <CoinIcon width="150" />
          <Heading>Build a Business</Heading>
          <Paragraph isMuted={true}>Monetize your product by taking fees on each transaction and join a growing number of relayers in the 0x ecosystem.</Paragraph>

          <CoinIcon width="150" />
          <Heading>Networked Liquidity</Heading>
          <Paragraph isMuted={true}>Allow your assets to appear on other 0x-based marketplaces by sharing your liquidity through an open order book.</Paragraph>
        </Column>
      </Wrap>
    </Section>
  </SiteWrap>
);

const ChapterLink = styled.a`
    font-size: 1.222222222rem;
    display: block;
    opacity: 0.8;
    margin-bottom: 1.666666667rem;

    &:first-child {
        opacity: 1;
    }

    &:hover {
        opacity: 1;
    }
`;
