import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Column, Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { constants } from 'ts/utils/constants';

export const VotePlaceholder = () => (
    <SiteWrap>
        <DocumentTitle title="0x Vote" />
        <Section isTextCentered={true} isPadded={true} padding="150px 0px">
            <Column>
                <Heading size="medium" isCentered={true}>
                    Come back on February 18th to vote
                </Heading>
                <Paragraph size="medium" isCentered={true} isMuted={true} marginBottom="0">
                    0x is conducting a vote on ZEIP-23, which adds the ability to trade bundles of ERC-20 and ERC-721
                    tokens via the 0x protocol. Integrating ZEIP-23 requires a modification to the protocol’s smart
                    contract pipeline, which has access to live digital assets. All ZRX token holders have the right to
                    vote on this improvement proposal.
                </Paragraph>
                <LinkWrap>
                    <Button
                        href={constants.URL_VOTE_BLOG_POST}
                        isWithArrow={true}
                        isAccentColor={true}
                        shouldUseAnchorTag={true}
                        target="_blank"
                    >
                        Learn More
                    </Button>
                </LinkWrap>
            </Column>
        </Section>
    </SiteWrap>
);

const LinkWrap = styled.div`
    display: inline-flex;
    margin-top: 60px;

    a + a {
        margin-left: 60px;
    }
`;
