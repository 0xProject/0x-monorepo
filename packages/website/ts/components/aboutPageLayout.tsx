import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { ChapterLink } from 'ts/components/chapter_link';
import { Column, Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';

import { addFadeInAnimation } from 'ts/constants/animations';
import { WebsitePaths } from 'ts/types';

interface Props {
    title: string;
    description: React.ReactNode | string;
    linkLabel?: string;
    href?: string;
    to?: string;
    children?: React.ReactNode;
}

export const AboutPageLayout = (props: Props) => (
    <SiteWrap theme="light">
        <Section isFlex={true} maxWidth="1170px" wrapWidth="100%">
            <Column>
                <ChapterLink to={WebsitePaths.AboutMission}>Mission</ChapterLink>
                <ChapterLink to={WebsitePaths.AboutTeam}>Team</ChapterLink>
                <ChapterLink to={WebsitePaths.AboutPress}>Press</ChapterLink>
                <ChapterLink to={WebsitePaths.AboutJobs}>Jobs</ChapterLink>
            </Column>

            <Column width="70%" maxWidth="800px">
                <Column width="100%" maxWidth="680px">
                    <AnimatedHeading size="medium">{props.title}</AnimatedHeading>

                    <AnimatedParagraph size="medium" marginBottom="60px" isMuted={0.65}>
                        {props.description}
                    </AnimatedParagraph>

                    {props.linkLabel && (props.href || props.to) && (
                        <AnimatedLink
                            to={props.to}
                            href={props.href}
                            target={!_.isUndefined(props.href) ? '_blank' : undefined}
                            isWithArrow={true}
                            isAccentColor={true}
                        >
                            {props.linkLabel}
                        </AnimatedLink>
                    )}
                </Column>
            </Column>
        </Section>

        {props.children}
    </SiteWrap>
);

const AnimatedHeading = styled(Heading)`
    ${addFadeInAnimation('0.5s')};
`;

const AnimatedParagraph = styled(Paragraph)`
    ${addFadeInAnimation('0.5s', '0.15s')};
`;

const AnimatedLink = styled(Button)`
    ${addFadeInAnimation('0.6s', '0.3s')};
`;
