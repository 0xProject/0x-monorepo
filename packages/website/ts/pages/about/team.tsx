import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { AboutPageLayout } from 'ts/components/aboutPageLayout';
import { DocumentTitle } from 'ts/components/document_title';
import { Column, Section } from 'ts/components/newLayout';
import { Heading, Paragraph } from 'ts/components/text';
import { WebsitePaths } from 'ts/types';
import { documentConstants } from 'ts/utils/document_meta_constants';

interface TeamMember {
    name: string;
    title: string;
    imageUrl?: string;
}

const team: TeamMember[] = [
    {
        imageUrl: '/images/team/willw.jpg',
        name: 'Will Warren',
        title: 'co-founder & CEO',
    },
    {
        imageUrl: '/images/team/amirb.jpg',
        name: 'Amir Bandeali',
        title: 'Co-founder & CTO',
    },
    {
        imageUrl: '/images/team/fabiob.jpg',
        name: 'Fabio Berger',
        title: 'engineering manager',
    },
    {
        imageUrl: '/images/team/alexv.jpg',
        name: 'Alex Xu',
        title: 'Director of operations',
    },
    {
        imageUrl: '/images/team/leonidL.jpg',
        name: 'Leonid Logvinov',
        title: 'engineer',
    },
    {
        imageUrl: '/images/team/benb.jpg',
        name: 'Ben Burns',
        title: 'designer',
    },
    {
        imageUrl: '/images/team/brandonm.jpg',
        name: 'Brandon Millman',
        title: 'senior engineer',
    },
    {
        imageUrl: '/images/team/toms.jpg',
        name: 'Tom Schmidt',
        title: 'product lead',
    },
    {
        imageUrl: '/images/team/jacobe.jpg',
        name: 'Jacob Evans',
        title: 'ecosystem engineer',
    },
    {
        imageUrl: '/images/team/blake.jpg',
        name: 'Blake Henderson',
        title: 'ecosystem programs lead',
    },
    {
        imageUrl: '/images/team/zack.jpg',
        name: 'Zack Skelly',
        title: 'lead recruiter',
    },
    {
        imageUrl: '/images/team/greg.jpg',
        name: 'Greg Hysen',
        title: 'blockchain engineer',
    },
    {
        imageUrl: '/images/team/remcoB.jpg',
        name: 'Remco Bloemen',
        title: 'technical fellow',
    },
    {
        imageUrl: '/images/team/francesco.jpg',
        name: 'Francesco Agosti',
        title: 'engineer',
    },
    {
        imageUrl: '/images/team/melo.jpg',
        name: 'Mel Oberto',
        title: 'people operations associate',
    },
    {
        imageUrl: '/images/team/alexb.jpg',
        name: 'Alex Browne',
        title: 'engineer in residence',
    },
    {
        imageUrl: '/images/team/peterz.jpg',
        name: 'Peter Zeitz',
        title: 'research fellow',
    },
    {
        imageUrl: '/images/team/chrisk.jpg',
        name: 'Chris Kalani',
        title: 'director of design',
    },
    {
        imageUrl: '/images/team/clayr.jpg',
        name: 'Clay Robbins',
        title: 'ecosystem development lead',
    },
    {
        imageUrl: '/images/team/mattt.jpg',
        name: 'Matt Taylor',
        title: 'marketing lead',
    },
    {
        imageUrl: '/images/team/eugenea.jpg',
        name: 'Eugene Aumson',
        title: 'engineer',
    },
    {
        imageUrl: '/images/team/weijew.jpg',
        name: 'Weijie Wu',
        title: 'research fellow',
    },
    {
        imageUrl: '/images/team/rahuls.jpg',
        name: 'Rahul Singireddy',
        title: 'relayer success manager',
    },
    {
        imageUrl: '/images/team/jasons.jpg',
        name: 'Jason Somensatto',
        title: 'strategic legal counsel',
    },
    {
        imageUrl: '/images/team/steveK.jpg',
        name: 'Steve Klebanoff',
        title: 'senior engineer',
    },
    {
        imageUrl: '/images/team/xianny.jpg',
        name: 'Xianny Ng',
        title: 'engineer',
    },
    {
        imageUrl: '/images/team/oshirob.png',
        name: 'Brent Oshiro',
        title: 'community engagement lead',
    },
    {
        imageUrl: '/images/team/marcs.jpg',
        name: 'Marc Savino',
        title: 'technical sourcer',
    },
];

const advisors: TeamMember[] = [
    {
        imageUrl: '/images/team/advisors/frede.jpg',
        name: 'Fred Ehrsam',
        title: 'Advisor',
    },
    {
        imageUrl: '/images/team/advisors/olafc.jpg',
        name: 'Olaf Carlson-Wee',
        title: 'Advisor',
    },
    {
        imageUrl: '/images/team/advisors/joeyk.jpg',
        name: 'Joey Krug',
        title: 'Advisor',
    },
    {
        imageUrl: '/images/team/advisors/lindax.jpg',
        name: 'Linda Xie',
        title: 'Advisor',
    },
    {
        imageUrl: '/images/team/advisors/davids.jpg',
        name: 'David Sacks',
        title: 'Advisor',
    },
];

export const NextAboutTeam = () => (
    <AboutPageLayout
        title="We are a global, growing team"
        description={
            <Paragraph size="medium" marginBottom="60px" isMuted={0.65}>
                We are a distributed team with backgrounds in engineering, academic research, business, and design.
                The 0x Core Team is passionate about accelerating the adoption decentralized technology and believe
                in its potential to be an equalizing force in the world. Join us and do the most impactful work of
                your life.
            </Paragraph>
        }
        linkLabel="Join the team"
        to={WebsitePaths.AboutJobs}
    >
        <DocumentTitle {...documentConstants.TEAM} />
        <Section maxWidth="1170px" wrapWidth="100%" isFlex={true} flexBreakpoint="900px">
            <Column>
                <Heading size="medium">0x Team</Heading>
            </Column>

            <Column width="70%" maxWidth="800px">
                <StyledGrid>
                    {_.map(team, (info: TeamMember, index: number) => (
                        <Member key={`team-${index}`} name={info.name} title={info.title} imageUrl={info.imageUrl} />
                    ))}
                </StyledGrid>
            </Column>
        </Section>

        <Section bgColor="#F3F6F4" maxWidth="1170px" wrapWidth="100%" flexBreakpoint="900px" isFlex={true}>
            <Column>
                <Heading size="medium">Advisors</Heading>
            </Column>

            <Column width="70%" maxWidth="800px">
                <StyledGrid>
                    {_.map(advisors, (info: TeamMember, index: number) => (
                        <Member key={`advisor-${index}`} name={info.name} title={info.title} imageUrl={info.imageUrl} />
                    ))}
                </StyledGrid>
            </Column>
        </Section>
    </AboutPageLayout>
);

const StyledGrid = styled.div`
    &:after {
        content: '';
        clear: both;
    }
`;

const Member = ({ name, title, imageUrl }: TeamMember) => (
    <StyledMember>
        <img src={imageUrl} alt={name} />
        <Name>{name}</Name>
        <MemberTitle isMuted={0.5} size={14} style={{ textTransform: 'capitalize' }}>
            {title}
        </MemberTitle>
    </StyledMember>
);

const StyledMember = styled.div`
    margin-bottom: 10px;
    float: left;
    width: calc(50% - 15px);
    margin-right: 15px;

    @media (max-width: 600px) {
        &:nth-child(2n + 1) {
            clear: left;
        }
    }

    img,
    svg {
        width: 100%;
        height: auto;
        object-fit: contain;
        margin-bottom: 10px;
    }

    @media (min-width: 600px) {
        width: calc(33.3333% - 30px);
        margin-right: 20px;

        &:nth-child(3n + 1) {
            clear: left;
        }
    }

    @media (min-width: 900px) {
        width: calc(25% - 30px);

        &:nth-child(3n + 1) {
            clear: none;
        }

        &:nth-child(4n + 1) {
            clear: left;
        }
    }
`;

const Name = styled.h3`
    color: ${colors.textDarkPrimary};
    font-size: 14px;
    line-height: 1;
    margin: 0;
`;

const MemberTitle = styled(Paragraph)`
    font-size: 14px;
`;
