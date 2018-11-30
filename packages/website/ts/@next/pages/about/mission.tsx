import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Column, Section, Wrap, WrapCentered } from 'ts/@next/components/layout';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Paragraph } from 'ts/@next/components/text';
import { Image } from 'ts/@next/components/image';

import CoinIcon from 'ts/@next/icons/illustrations/coin.svg';
import ConsistentlyShipIcon from 'ts/@next/icons/illustrations/consistently-ship.svg';
import RightThingIcon from 'ts/@next/icons/illustrations/right-thing.svg';
import LongTermImpactIcon from 'ts/@next/icons/illustrations/long-term-impact.svg';

export const NextAboutMission = () => (
  <SiteWrap>
    <Section>
      <Wrap>
         <Column colWidth="1/3">
            <ChapterLink href="#">Our Mission</ChapterLink>
            <ChapterLink href="#">Team</ChapterLink>
            <ChapterLink href="#">Press</ChapterLink>
            <ChapterLink href="#">Jobs</ChapterLink>
        </Column>
        <Column colWidth="2/3">
            <Heading size="medium">Creating a tokenized world where all value can flow freely.</Heading>
            <Paragraph size="medium">0x Protocol is an important infrastructure layer for the emerging crypto economy and enables markets to be created that couldn't have existed before. As more assets become tokenized, public blockchains provide the opportunity to establish a new financial stack that is more efficient, transparent, and equitable than any system in the past.</Paragraph>
            <Paragraph>Our missions and values (arrow)</Paragraph>
        </Column>
      </Wrap>
    </Section>

    <Section fullWidth noPadding>
        <Wrap width="full">
            <Image src="/images/@next/about/about-mission@2x.jpg" height="320" alt="" center />
        </Wrap>
    </Section>

    <Section>
      <Wrap>
        <Column colWidth="1/3">
            <Heading size="medium">Core<br/>Values</Heading>
        </Column>

        <Column colWidth="2/3">
            <Wrap>
                <Column colWidth="1/3">
                    <RightThingIcon width="100" />
                </Column>
                <Column colWidth="2/3">
                    <Heading size="medium">Do The Right Thing</Heading>
                    <Paragraph muted>We acknowledge the broad subjectivity behind doing “the right thing,” and are committed to rigorously exploring its nuance in our decision making. We believe this responsibility drives our decision making above all else, and pledge to act in the best interest of our peers, community, and society as a whole.</Paragraph>
                </Column>
            </Wrap>
            <Wrap>
                <Column colWidth="1/3">
                    <ConsistentlyShipIcon width="100" />
                </Column>
                <Column colWidth="2/3">
                    <Heading size="medium">Consistently Ship</Heading>
                    <Paragraph muted>Achieving our mission requires dedication and diligence. We aspire to be an organization that consistently ships. We set high-impact goals that are rooted in data and pride ourselves in consistently outputting outstanding results across the organization.</Paragraph>
                </Column>
            </Wrap>
            <Wrap>
                <Column colWidth="1/3">
                    <LongTermImpactIcon width="100" />
                </Column>
                <Column colWidth="2/3">
                    <Heading size="medium">Focus on long-term Impact</Heading>
                    <Paragraph muted>We anticipate that over time, awareness of the fundamentally disruptive nature of frictionless global exchange will cause some to see this technology as a threat. There will be setbacks, some will claim that this technology is too disruptive, and we will face adversity. Persistence and a healthy long-term focus will see us through these battles.</Paragraph>
                </Column>
            </Wrap>
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
