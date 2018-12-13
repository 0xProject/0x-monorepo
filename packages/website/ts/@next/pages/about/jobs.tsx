import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { AboutPageLayout } from 'ts/@next/components/aboutPageLayout';
import { Column, FlexWrap, Section } from 'ts/@next/components/newLayout';
import { Link } from 'ts/@next/components/link';
import { Separator } from 'ts/@next/components/separator';
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

export const NextAboutJobs = () => (
    <AboutPageLayout
        title="Join Us in Our Mission"
        description="To create a tokenized world where all value can flow freely. We are powering a growing ecosystem of decentralized applications and solving novel challenges to make our technology intuitive, flexible, and accessible to all. Read more about our mission, and join us in building financial infrastructure upon which the exchange of anything of value will take place."
        linkLabel="Our mission and values"
        linkUrl="/mission"
    >
        <Section bgColor="#F3F6F4" isFlex={true} maxWidth="1170px" wrapWidth="100%">
                <Column maxWidth="442px">
                    <Heading size="medium" marginBottom="30px">
                        Powered by a Diverse Worldwide Community
                    </Heading>

                    <Paragraph>
                        We're a highly technical team with varied backgrounds in engineering, science, business, finance, and research. While the core team is headquartered in San Francisco, there are 30+ teams building on 0x and hundreds of thousands of participants behind our efforts globally. We're passionate about open-source software and decentralized technology's potential to act as an equalizing force in the world.
                    </Paragraph>
                </Column>

                <Column maxWidth="600px">
                    <ImageWrap>
                        <img src="/images/@next/jobs/map@2x.png" height="365" alt="Map of community"/>
                    </ImageWrap>
                </Column>
        </Section>

        <Section isFlex={true} maxWidth="1170px" wrapWidth="100%">
                <Column colWidth="1/3">
                    <Heading size="medium">Benefits</Heading>
                </Column>

                <Column maxWidth="826px">
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
        </Section>

        <Section isFlex={true} maxWidth="1170px" wrapWidth="100%">
            <Column>
                <Heading size="medium">Current<br/>Openings</Heading>
            </Column>

            <Column maxWidth="826px">

                    {_.map(positions, (position, index) => (
                        <Position key={`position-${index}`} position={position} />
                    ))}
            </Column>
        </Section>
    </AboutPageLayout>
);

const Position = ({ position }) => (
    <FlexWrap>
        <Column width="30%">
            <Heading size="small">{position.title}</Heading>
        </Column>

        <StyledColumn width="50%">
            <Paragraph isMuted={true}>{position.location}</Paragraph>
        </Column>

        <Column colWidth="1/3">
            <Paragraph><Link href={position.href}>Apply</Link></Paragraph>
        </Column>
    </FlexWrap>
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

const ImageWrap = styled.figure`
    @media (min-width: 768px) {
        height: 600px;
        padding-left: 60px;
        display: flex;
        align-items: flex-end;
    }
`;

const StyledColumn = styled(Column)`
    flex-shrink: 0;
`;
