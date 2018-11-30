import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Button, ButtonTransparent } from 'ts/@next/components/button';
import { Column, Section, Wrap, WrapCentered } from 'ts/@next/components/layout';
import { Heading, Intro, Text } from 'ts/@next/components/text';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Icon } from 'ts/@next/components/icon';

import protocol from 'ts/@next/icons/illustrations/protocol.svg';
import customize from 'ts/@next/icons/illustrations/customize.svg';
import logoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';

export const NextWhy = () => (
  <SiteWrap>
    <Section>
      <WrapCentered>
        <Column colWidth="2/3">
          <Heading center>The exchange layer for the crypto economy</Heading>
          <Intro center>The world's assets are becoming tokenized on public blockchains. 0x Protocol is free, open-source infrastructure that allows anyone in the world to build products that enable the purchasing and trading of crypto tokens.</Intro>
          <Text center>Build on 0x (arrow)</Text>
        </Column>
      </WrapCentered>
    </Section>

    <Section bgColor={colors.backgroundDark}>
      <Wrap>
        <Column colWidth="1/3">
            <Icon size="150" icon={protocol} />
            <Heading>Support for all Ethereum Standards</Heading>
            <Text>0x Protocol facilitates the decentralized exchange of a growing number of Ethereum-based tokens, including all ERC-20 and ERC-721 assets. Additional ERC standards can be added to the protocol...</Text>
        </Column>

        <Column colWidth="1/3">
            <Icon size="150" icon={logoOutlined} />
            <Heading>Shared Networked Liquidity</Heading>
            <Text>0x is building a layer of networked liquidity that will lower the barriers to entry. By enabling businesses to tap into a shared pool of digital assets, it will create a more stable financial system.</Text>
        </Column>

        <Column colWidth="1/3">
            <Icon size="150" icon={customize} />
            <Heading>Customize the User Experience</Heading>
            <Text>Relayers are businesses around the world that utilize 0x to integrate exchange functionality into a wide variety of products including order books, games, and digital art marketplaces.</Text>
        </Column>
      </Wrap>
    </Section>

    <Section>
      <Wrap>
        <Column colWidth="1/3">
          This is a 1 COLUMN section
        </Column>

        <Column colWidth="2/3">
        This is a 2 COLUMN section
        </Column>
      </Wrap>
    </Section>
  </SiteWrap>
);
