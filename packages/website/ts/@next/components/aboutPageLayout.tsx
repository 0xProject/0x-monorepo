import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/@next/components/button';
import { ChapterLink } from 'ts/@next/components/chapter_link';
import { Column, Section } from 'ts/@next/components/newLayout';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Paragraph } from 'ts/@next/components/text';

import { addFadeInAnimation } from 'ts/@next/constants/animations';

interface Props {
    title: string;
    description: React.ReactNode | string;
    linkLabel?: string;
    linkUrl?: string;
    children?: React.ReactNode;
}

export const AboutPageLayout = (props: Props) => (
    <SiteWrap theme="light">
        <Section isFlex={true} maxWidth="1170px" wrapWidth="100%">
            <Column>
               <ChapterLink to="/next/about/mission">Mission</ChapterLink>
               <ChapterLink to="/next/about/team">Team</ChapterLink>
               <ChapterLink to="/next/about/press">Press</ChapterLink>
               <ChapterLink to="/next/about/jobs">Jobs</ChapterLink>
           </Column>

           <Column width="70%" maxWidth="800px">
               <Column width="100%" maxWidth="680px">
                    <AnimatedHeading size="medium">
                        {props.title}
                    </AnimatedHeading>

                   <AnimatedParagraph size="medium" marginBottom="60px" isMuted={0.65}>
                     {props.description}
                   </AnimatedParagraph>

                   {(props.linkLabel && props.linkUrl) &&
                        <AnimatedLink
                            to={props.linkUrl}
                            isWithArrow={true}
                            isAccentColor={true}
                        >
                            {props.linkLabel}
                        </AnimatedLink>
                   }
                </Column>
            </Column>
        </Section>

        {props.children}
    </SiteWrap>
);

const AnimatedHeading = styled(Heading)`
  ${addFadeInAnimation('0.5s')}
`;

const AnimatedParagraph = styled(Paragraph)`
  ${addFadeInAnimation('0.5s', '0.15s')}
`;

const AnimatedLink = styled(Button)`
  ${addFadeInAnimation('0.6s', '0.3s')}
`;
