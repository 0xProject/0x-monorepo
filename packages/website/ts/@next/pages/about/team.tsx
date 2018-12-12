import * as _ from 'lodash/core';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { AboutPageLayout } from 'ts/@next/components/aboutPageLayout';
import { Column, Section, WrapGrid } from 'ts/@next/components/newLayout';
import { Heading, Paragraph } from 'ts/@next/components/text';

interface TeamMember {
    name: string;
    title: string;
    imageUrl?: string;
}

const team: TeamMember[] = [
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Will Warren',
        title: 'co-founder & ceo',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Amir Bandeali',
        title: 'co-founder & cto',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Fabio Berger',
        title: 'senior engineer',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Alex Xu',
        title: 'director of operations',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Leonid Logvinov',
        title: 'engineer',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Ben Burns',
        title: 'designer',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Brandon Millman',
        title: 'senior engineer',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Tom Schmidt',
        title: 'product manager',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Jacob Evans',
        title: 'ecosystem engineer',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Blake Henderson',
        title: 'operations associate',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Zack Skelly',
        title: 'lead recruiter',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Greg Hysen',
        title: 'blockchain engineer',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Remco Bloemen',
        title: 'technical fellow',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Francesco Agosti',
        title: 'engineer',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Mel Oberto',
        title: 'office ops / executive assistant',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Alex Browne',
        title: 'engineer in residence',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Peter Zeitz',
        title: 'research fellow',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Chris Kalani',
        title: 'director of design',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Clay Robbins',
        title: 'ecosystem development lead',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Matt Taylor',
        title: 'marketing lead',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Eugene Aumson',
        title: 'engineer',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Weijie Wu',
        title: 'research fellow',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Rahul Singireddy',
        title: 'relayer success manager',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Jason Somensatto',
        title: 'strategic legal counsel',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Steve Klebanoff',
        title: 'senior engineer',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Xianny Ng',
        title: 'engineer',
    },
];

const advisors: TeamMember[] = [
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Fred Ehrsam',
        title: 'Advisor',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Olaf Carlson-Wee',
        title: 'Advisor',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Joey Krug',
        title: 'Advisor',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'Linda Xie',
        title: 'Advisor',
    },
    {
        imageUrl: '/images/@next/team/melo@2x.jpg',
        name: 'David Sacks',
        title: 'Advisor',
    },
];

export const NextAboutTeam = () => (
    <AboutPageLayout
        title="We are a global, growing team"
        description="We are a distributed team with backgrounds in engineering, academic research, business, and design. The 0x Core Team is passionate about accelerating the adoption decentralized technology and believe in its potential to be an equalizing force in the world. Join us and do the most impactful work of your life."
        linkLabel="Join the team"
        linkUrl="/jobs"
    >
        <Section
            maxWidth="1170px"
            isFlex={true}
        >
            <Column>
                <Heading size="medium">0x Team</Heading>
            </Column>

            <Column
                width="70%"
                maxWidth="800px"
            >
                <WrapGrid isWrapped={true} isCentered={false}>
                    {_.map(team, (info: TeamMember, index) => (
                        <Member key={`team-${index}`} name={info.name} title={info.title} imageUrl={info.imageUrl} />
                    ))}
                </Wrap>
            </Column>
        </Section>

        <Section
            bgColor="#F3F6F4"
            maxWidth="1170px"
            isFlex={true}
        >
            <Column>
                <Heading size="medium">Advisors</Heading>
            </Column>

            <Column width="70%" maxWidth="800px">
                <WrapGrid isWrapped={true} isCentered={false}>
                    {_.map(advisors, (info: TeamMember, index) => (
                        <Member key={`advisor-${index}`} name={info.name} title={info.title} imageUrl={info.imageUrl} />
                    ))}
                </WrapGrid>
            </Column>
        </Section>
    </AboutPageLayout>
);

const Member = ({ name, title, imageUrl }: TeamMember) => (
    <StyledMember>
        <img src={imageUrl} alt={name}/>
        <Heading color={colors.textDarkPrimary} size="small" isNoMargin={true}>{name}</Heading>
        <Paragraph isMuted={0.5} style={{ textTransform: 'capitalize' }}>{title}</Paragraph>
    </StyledMember>
);

const StyledMember = styled.div`
    width: calc(25% - 10px);
    margin-bottom: 10px;

    img, svg {
        width: 100%;
        height: auto;
        object-fit: contain;
        margin-bottom: 10px;
    }

    @media (max-width: 900px) {
        width: calc(33.3333% - 30px);
    }

    @media (max-width: 600px) {
        width: calc(50% - 15px);
    }
`;
