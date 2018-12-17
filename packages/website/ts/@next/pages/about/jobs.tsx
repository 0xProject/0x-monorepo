import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { AboutPageLayout } from 'ts/@next/components/aboutPageLayout';
import { Link } from 'ts/@next/components/link';
import { Column, FlexWrap, Section } from 'ts/@next/components/newLayout';
import { Heading, Paragraph } from 'ts/@next/components/text';

interface PositionProps {
    title: string;
    location: string;
    href: string;
}

interface PositionItemProps {
    position: PositionProps;
}

const positions: PositionProps[] = [
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
        description={
            <>
            <Paragraph size="medium">
                To create a tokenized world where all value can flow freely.
            </Paragraph>
            <Paragraph size="medium">
                We are growing an ecosystem of businesses and projects by solving difficult challenges to make our technology intuitive, flexible, and accessible to all. Join us in building infrastructure upon which the exchange of all assets will take place.
            </Paragraph>
            </>
        }
        linkLabel="Our mission and values"
        linkUrl="/about/mission"
    >
        <Section bgColor="#F3F6F4" isFlex={true} maxWidth="1170px" wrapWidth="100%">
                <Column maxWidth="442px">
                    <Heading size="medium" marginBottom="30px">
                        Powered by a Diverse, Global Community
                    </Heading>

                    <Paragraph>
                        We're a highly technical team with varied backgrounds in engineering, science, business, finance, and research. While the Core Team is headquartered in San Francisco, there are 30+ teams building on 0x and hundreds of thousands of participants behind our efforts worldwide. We're passionate about open-source software and decentralized technology's potential to act as an equalizing force in the world.
                    </Paragraph>
                </Column>

                <Column maxWidth="600px">
                    <ImageWrap>
                        <img src="/images/@next/jobs/map@2x.png" height="365" alt="Map of community"/>
                    </ImageWrap>
                </Column>
        </Section>

        <Section isFlex={true} maxWidth="1170px" wrapWidth="100%">
                <Column>
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

export const Position: React.FunctionComponent<PositionItemProps> = (props: PositionItemProps) => {
    const { position } = props;
    return (
        <PositionWrap>
            <StyledColumn width="30%">
                <Heading asElement="h3" size="small" fontWeight="400" marginBottom="0"><a href={position.href}>{position.title}</a></Heading>
            </StyledColumn>

            <StyledColumn width="50%" padding="0 40px 0 0">
                <Paragraph isMuted={true} marginBottom="0">{position.location}</Paragraph>
            </StyledColumn>

            <StyledColumn width="20%">
                <Paragraph marginBottom="0" textAlign="right"><Link href={position.href}>Apply</Link></Paragraph>
            </StyledColumn>
        </PositionWrap>
    );
};

const BenefitsList = styled.ul`
    color: #000;
    font-weight: 300;
    line-height: 1.444444444;
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

    @media (max-width: 768px) {
        & + & {
            margin-top: 15px;
        }
    }
`;

const PositionWrap = styled(FlexWrap)`
    margin-bottom: 40px;
    padding-bottom: 30px;
    position: relative;

    &:after {
        content: '';
        width: 100%;
        position: absolute;
        bottom: 0;
        left: 0;
        height: 1px;
        background-color: #E3E3E3;
    }
`;
