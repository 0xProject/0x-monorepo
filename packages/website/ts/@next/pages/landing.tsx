import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors'
import { Button } from 'ts/@next/components/button';
import { Column, Section, Wrap, WrapCentered } from 'ts/@next/components/layout';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Intro, Text } from 'ts/@next/components/text';

import logoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';
import protocol from 'ts/@next/icons/illustrations/protocol.svg';


const Icon = styled.div`
    flex-shrink: 0;
`;

export const NextLanding = () => (
  <SiteWrap>
    <Section>
      <Wrap>
        <Column colWidth="2/3">
          <Heading>Powering Decentralized Exchange</Heading>
          <Intro>0x is the best solution for adding exchange functionality to your business.</Intro>
          <div>
            <Button inline>
              Get Started
            </Button>

            <Button transparent inline>
              Learn More
            </Button>
          </div>
        </Column>

        <Column colWidth="1/3">
          <Icon as={logoOutlined as 'svg'} />
        </Column>
      </Wrap>
    </Section>

    <Section bgColor={colors.backgroundDark}>
      <WrapCentered>
        <Icon as={protocol as 'svg'} />
        <Text size="medium">0x is the best solution for adding exchange functionality to your business.</Text>
        <Text size="medium">Discover how developers use 0x (need arrow + line under)</Text>
      </WrapCentered>
    </Section>

    <Section>
      <Wrap>
        <Column colWidth="2/3">
          Powering Decentralized Exchange<br/>
          Example of a 2/3 1/3 assymetric composition
        </Column>

        <Column colWidth="1/3">
          RIGHT IMAGE
        </Column>
      </Wrap>
    </Section>

    <Section
      bgColor="#ff0000"
      fullWidth
      noPadding>
      <Wrap width="full">
        <Column colWidth="2/3">
          SAMPLE FLUSHED width
        </Column>

        <Column colWidth="1/3">
          RIGHT IMAGE
        </Column>
      </Wrap>
    </Section>

    <Section bgColor="#003831">
      <Wrap
        width="narrow">
        0x is an open protocol that enables the peer-to-peer exchange of Ethereum-based tokens. Anyone can utilize 0x to service a wide variety of markets ranging from gaming items to traditional financial assets.
      </Wrap>

      <Wrap>
        <Column colWidth="1/3">
          This
        </Column>

        <Column colWidth="1/3">
          is a
        </Column>

        <Column colWidth="1/3">
          three-column module
        </Column>
      </Wrap>
    </Section>

    <Section>
      <Wrap>
        <Column colWidth="1/2">
          This is a 2 COLUMN section
        </Column>

        <Column colWidth="1/2">
          Again a 2 column section
        </Column>
      </Wrap>
    </Section>
  </SiteWrap>
);
