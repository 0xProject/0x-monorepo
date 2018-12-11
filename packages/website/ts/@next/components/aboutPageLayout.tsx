import * as React from 'react';
import styled from 'styled-components';

import { Link } from 'ts/@next/components/button';
import { ChapterLink } from 'ts/@next/components/chapter_link';
import { BREAKPOINTS, Column, Section, Wrap } from 'ts/@next/components/layout';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Paragraph } from 'ts/@next/components/text';

interface Props {
    title: string;
    description: React.Node;
    linkLabel?: string;
    linkUrl?: string;
}

export const AboutPageLayout = (props: Props) => (
    <SiteWrap theme="light">
        <Section isPadLarge={true}>
            <Wrap>
               <Nav colWidth="1/3">
                  <ChapterLink to="/next/about/mission">Our Mission</ChapterLink>
                  <ChapterLink to="/next/about/team">Team</ChapterLink>
                  <ChapterLink to="/next/about/press">Press</ChapterLink>
                  <ChapterLink to="/next/about/jobs">Jobs</ChapterLink>
              </Nav>

              <Column colWidth="2/3">
                  <IntroWrap>
                      <Heading size="medium">
                        {props.title}
                      </Heading>
                      <Paragraph size="medium" marginBottom="60px">
                        {props.description}
                      </Paragraph>

                      {(props.linkLabel && props.linkUrl) &&
                          <Link href={props.linkUrl} isNoBorder={true} isWithArrow={true}>
                                {props.linkLabel}
                          </Link>
                      }
                  </IntroWrap>
              </Column>
             </Wrap>
        </Section>

        {props.children}
    </SiteWrap>
);

const IntroWrap = styled.div`
    max-width: 680px;
`;

const Nav = styled(Column)`
    @media (max-width: ${BREAKPOINTS.mobile}) {
        // display: none;
    }
`;
