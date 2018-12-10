import * as React from 'react';
import * as _ from 'lodash';
import styled from 'styled-components';

import { ChapterLink } from 'ts/@next/components/chapter_link';
import { Column, Section, Wrap } from 'ts/@next/components/layout';
import { Link } from 'ts/@next/components/link';
import { Separator } from 'ts/@next/components/separator';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Paragraph } from 'ts/@next/components/text';

interface HighlightInterface {
    logo: string;
    title?: string;
    text: string;
    href: string;
}

const highlights: HighlightInterface[] = [
    {
        logo: '/images/@next/press/logo-venturebeat.png',
        title: 'VentureBeat',
        text: '0x leads the way for ‘tokenization’ of the world, and collectible game items are next',
        href: '#',
    },
    {
        logo: '/images/@next/press/logo-fortune.png',
        title: 'Fortune',
        text: 'In the future, many traditional investments like real estate and corporate shares will come in the form of digital tokens that are bought and transferred on a blockchain. ',
        href: '#',
    },
    {
        logo: '/images/@next/press/logo-techcrunch.png',
        title: 'TechCrunch',
        text: '0x allows any developer to quickly build their own decentralized cryptocurrency exchange and decide their own fees.',
        href: '#',
    },
];

const Highlight = ({ highlight }) => (
    <>
    <Wrap>
        <Column colWidth="1/3">
            <img src={highlight.logo} alt={highlight.title} />
        </Column>
        <Column colWidth="2/3">
            <Paragraph isMuted={false}>{highlight.text}</Paragraph>
            <Link href={highlight.href}>Read Article</Link>
        </Column>
    </Wrap>
    <Separator/>
    </>
);

export const NextAboutPress = () => (
  <SiteWrap theme="light">
    <Section>
      <Wrap>
         <Column colWidth="1/3">
            <ChapterLink to="/next/about/mission">Our Mission</ChapterLink>
            <ChapterLink to="/next/about/team">Team</ChapterLink>
            <ChapterLink to="/next/about/press">Press</ChapterLink>
            <ChapterLink to="/next/about/jobs">Jobs</ChapterLink>
        </Column>
        <Column colWidth="2/3">
            <Heading size="medium">Press Highlights</Heading>
            <Paragraph size="medium">Want to write about 0x? Get in touch, or download our press kit.</Paragraph>

            <Separator/>

            {_.map(highlights, (highlight, index) => <Highlight key={`highlight-${index}`} highlight={highlight} /> )}
        </Column>
      </Wrap>
    </Section>
  </SiteWrap>
);
