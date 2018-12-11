import * as React from 'react';
import * as _ from 'lodash/core';
import styled from 'styled-components';

import { ChapterLink } from 'ts/@next/components/chapter_link';
import { Column, Section, Wrap } from 'ts/@next/components/layout';
import { Link } from 'ts/@next/components/link';
import { Separator } from 'ts/@next/components/separator';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Paragraph } from 'ts/@next/components/text';

interface PositionInterface {
    title: string;
    location: string;
    href: string;
}

const positions: PositionInterface[] = [
    {
        title: 'Product Designer',
        location: 'San Francisco, Remote',
        href: '#',
    },
    {
        title: 'Product Designer',
        location: 'San Francisco, Remote',
        href: '#',
    },
    {
        title: 'Product Designer',
        location: 'San Francisco, Remote',
        href: '#',
    },
    {
        title: 'Open Positition',
        location: "We're always interested in talking to talented people. Send us an application if you think you're the right fit.",
        href: '#',
    },
];

const Position = ({ position }) => (
    <>
        <Wrap>
            <Column colWidth="1/3">
                <Heading size="small">{position.title}</Heading>
            </Column>
            <Column colWidth="1/3">
                <Paragraph isMuted={true}>{position.location}</Paragraph>
            </Column>
            <Column colWidth="1/3">
                <Paragraph><Link href={position.href}>Apply</Link></Paragraph>
            </Column>
        </Wrap>
        <Separator/>
    </>
);

export const NextAboutJobs = () => (
  <SiteWrap theme="light">
    <Section isPadLarge={true}>
      <Wrap>
         <Column colWidth="1/3">
            <ChapterLink to="/next/about/mission">Our Mission</ChapterLink>
            <ChapterLink to="/next/about/team">Team</ChapterLink>
            <ChapterLink to="/next/about/press">Press</ChapterLink>
            <ChapterLink to="/next/about/jobs">Jobs</ChapterLink>
        </Column>
        <Column colWidth="2/3">
          <div style={{ maxWidth: '680px' }}>
              <Heading size="medium">
                  Join Us in Our Mission
              </Heading>
              <Paragraph size="medium">
                  To create a tokenized world where all value can flow freely. We are powering a growing ecosystem of decentralized applications and solving novel challenges to make our technology intuitive, flexible, and accessible to all. Read more about our mission, and join us in building financial infrastructure upon which the exchange of anything of value will take place.
              </Paragraph>
              <Link href="#">Our misson and values</Link>
            </div>
        </Column>
      </Wrap>
    </Section>

    <Section bgColor="#F3F6F4" isPadLarge={true}>
        <Wrap>
            <Column colWidth="1/3">
                <Heading size="medium" isNoMargin={true}>
                    Powered by a Diverse Worldwide Community
                </Heading>
            </Column>
        </Wrap>
        <Wrap>
            <Column colWidth="1/3">
                <Paragraph>
                    We're a highly technical team with varied backgrounds in engineering, science, business, finance, and research. While the core team is headquartered in San Francisco, there are 30+ teams building on 0x and hundreds of thousands of participants behind our efforts globally. We're passionate about open-source software and decentralized technology's potential to act as an equalizing force in the world.
                </Paragraph>
            </Column>

            <Column colWidth="2/3">
                <img src="/images/@next/jobs/map@2x.png" height="365" alt="Map of community"/>
            </Column>
        </Wrap>
    </Section>

    <Section isPadLarge={true}>
      <Wrap>
        <Column colWidth="1/3">
            <Heading size="medium">Benefits</Heading>
        </Column>

        <Column colWidth="2/3">
            <Wrap>
                <Column>
                    <BenefitsList>
                        <li>Comprehensive Insurance</li>
                        <li>Unlimited Vacation</li>
                        <li>Meals and snacks provided daily</li>
                        <li>Flexible hours and liberal  work-from-home-policy</li>
                        <li>Supportive of remote working</li>
                        <li>Transportation, phone, and wellness expense</li>
                        <li>Relocation assistance</li>
                        <li>Optional team excursions</li>
                        <li>Competitive salary</li>
                        <li>Cryptocurrency based compensation</li>
                    </BenefitsList>
                </Column>
            </Wrap>
        </Column>
      </Wrap>
    </Section>

    <Section isPadLarge={true}>
      <Wrap>
        <Column colWidth="1/3">
            <Heading size="medium">Current<br/>Openings</Heading>
        </Column>

        <Column colWidth="2/3">
            {_.map(positions, (position, index) => <Position key={`position-${index}`} position={position} /> )}
        </Column>
      </Wrap>
    </Section>
  </SiteWrap>
);

const BenefitsList = styled.ul`
    color: #000;
    list-style: disc;
    columns: auto 2;
    column-gap: 80px;

    li {
        margin-bottom: 1em;
    }
`;
