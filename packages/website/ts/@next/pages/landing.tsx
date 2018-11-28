import * as React from 'react';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Section, Wrap, Column } from 'ts/@next/components/layout';


export const NextLanding = () => (
  <SiteWrap>
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
