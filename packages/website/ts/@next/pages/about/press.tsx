import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { AboutPageLayout } from 'ts/@next/components/aboutPageLayout';
import { Link } from 'ts/@next/components/button';
import { Column, FlexWrap, Section } from 'ts/@next/components/newLayout';
import { Separator } from 'ts/@next/components/separator';
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

export const NextAboutPress = () => (
    <AboutPageLayout
        title="Press Highlights"
        description={
            <>
                <Paragraph marginBottom="60px">
                    Want to write about 0x? Get in touch, or download our press kit.
                </Paragraph>

                {_.map(highlights, (highlight, index) => (
                    <Highlight key={`highlight-${index}`} highlight={highlight} />
                ))}
            </>
        }
    />
);

const Highlight = ({ highlight }) => (
    <HighlightWrap>
        <Column>
            <img src={highlight.logo} alt={highlight.title} />
        </Column>

        <Column width="60%" maxWidth="560px">
            <Paragraph isMuted={false}>{highlight.text}</Paragraph>
            <Link href={highlight.href} isWithArrow={true} isNoBorder={true}>Read Article</Link>
        </Column>
    </HighlightWrap>
);

const HighlightWrap = styled(FlexWrap)`
    border-top: 1px solid #eaeaea;
    padding: 30px 0;
`;
