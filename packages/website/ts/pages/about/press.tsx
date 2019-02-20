import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { AboutPageLayout } from 'ts/components/aboutPageLayout';
import { Button } from 'ts/components/button';
import { DocumentTitle } from 'ts/components/document_title';
import { Column, FlexWrap } from 'ts/components/newLayout';
import { Paragraph } from 'ts/components/text';
import { documentConstants } from 'ts/utils/document_meta_constants';

interface HighlightProps {
    logo: string;
    title?: string;
    text: string;
    href: string;
}

interface HighlightItemProps {
    highlight: HighlightProps;
}

const highlights: HighlightProps[] = [
    {
        logo: '/images/press/logo-forbes.png',
        title: 'Forbes',
        text:
            '0x Instant is aiming to aid businesses and developers such as news sites, crypto wallets, dApps or price trackers to monetize or add a new revenue stream to their existing pipeline.',
        href:
            'https://www.forbes.com/sites/rebeccacampbell1/2018/12/06/0x-launches-instant-delivers-an-easy-and-flexible-way-to-buy-crypto-tokens/#bfb73a843561',
    },
    {
        logo: '/images/press/logo-venturebeat.png',
        title: 'VentureBeat',
        text: '0x leads the way for ‘tokenization’ of the world, and collectible game items are next',
        href:
            'https://venturebeat.com/2018/09/24/0x-leads-the-way-for-tokenization-of-the-world-and-collectible-game-items-are-next/',
    },
    {
        logo: '/images/press/logo-fortune.png',
        title: 'Fortune',
        text:
            'In the future, many traditional investments like real estate and corporate shares will come in the form of digital tokens that are bought and transferred on a blockchain.',
        href: 'http://fortune.com/2018/09/06/0x-harbor-blockchain/',
    },
    {
        logo: '/images/press/logo-techcrunch.png',
        title: 'TechCrunch',
        text:
            '0x allows any developer to quickly build their own decentralized cryptocurrency exchange and decide their own fees.',
        href: 'https://techcrunch.com/2018/07/16/0x/',
    },
];

export const NextAboutPress = () => (
    <AboutPageLayout
        title="Press Highlights"
        description={
            <>
                <Paragraph size="medium" marginBottom="60px">
                    Want to write about 0x? <a href="mailto:team@0xproject.com">Get in touch.</a>
                </Paragraph>

                {_.map(highlights, (highlight, index) => (
                    <Highlight key={`highlight-${index}`} highlight={highlight} />
                ))}
            </>
        }
    >
        <DocumentTitle {...documentConstants.PRESS} />
    </AboutPageLayout>
);

export const Highlight: React.FunctionComponent<HighlightItemProps> = (props: HighlightItemProps) => {
    const { highlight } = props;
    return (
        <HighlightWrap>
            <Column>
                <img src={highlight.logo} alt={highlight.title} />
            </Column>

            <Column width="60%" maxWidth="560px">
                <Paragraph isMuted={false}>{highlight.text}</Paragraph>
                <Button href={highlight.href} isWithArrow={true} isNoBorder={true} target="_blank">
                    Read Article
                </Button>
            </Column>
        </HighlightWrap>
    );
};

const HighlightWrap = styled(FlexWrap)`
    border-top: 1px solid #eaeaea;
    padding: 30px 0;
`;
