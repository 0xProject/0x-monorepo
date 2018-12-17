import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Banner } from 'ts/@next/components/banner';
import { Button } from 'ts/@next/components/button';
import { Icon } from 'ts/@next/components/icon';
import { ModalContact } from 'ts/@next/components/modals/modal_contact';
import { Column, Section, WrapGrid } from 'ts/@next/components/newLayout';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Paragraph } from 'ts/@next/components/text';

interface BenefitProps {
    title: string;
    icon: string;
    description: string;
}

interface EventProps {
    title: string;
    date: string;
    signupUrl: string;
    imageUrl: string;
}

const benefits: BenefitProps[] = [
    {
        icon: 'milestoneGrants',
        title: 'Milestone Grants',
        description: 'Receive non-dilutive capital ranging from $10,000 to $100,000, with grant sizes awarded based on the quality of your team, vision, execution, and community involvement.',
    },
    {
        icon: 'vcIntroductions',
        title: 'VC Introductions',
        description: 'Connect with leading venture capital firms that could participate in your next funding round.',
    },
    {
        icon: 'techSupport',
        title: 'Technical Support',
        description: 'Receive ongoing technical assistance from knowledgeable and responsive 0x developers.',
    },
    {
        icon: 'recruitingSupport',
        title: 'Recruiting Assistance',
        description: 'Grow your team by accessing an exclusive pool of top engineering and business operations talent.',
    },
    {
        icon: 'eficientDesign',
        title: 'Marketing and Design Help',
        description: 'Get strategic advice on product positioning, customer acquisition, and UI/UX design that can impact the growth of your business.',
    },
    {
        icon: 'legalResources',
        title: 'Legal Resources',
        description: 'Access important legal resources that will help you navigate the regulatory landscape.',
    },
];

const events: EventProps[] = [
    {
        title: '0x London Meetup',
        date: 'October 20th 2018',
        imageUrl: '/images/@next/events/event-sample.jpg',
        signupUrl: '#',
    },
    {
        title: '0x Berlin Meetup',
        date: 'October 20th 2018',
        imageUrl: '/images/@next/events/event-sample.jpg',
        signupUrl: '#',
    },
    {
        title: '0x San Francisco Meetup',
        date: 'October 20th 2018',
        imageUrl: '/images/@next/events/event-sample.jpg',
        signupUrl: '#',
    },
];

export class NextCommunity extends React.Component {
    public state = {
        isContactModalOpen: false,
    };
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <Section isTextCentered={true}>
                    <Column>
                        <Heading size="medium" isCentered={true}>
                            Community
                        </Heading>
                        <Paragraph size="medium" isCentered={true} isMuted={true} marginBottom="0">
                            The 0x community is a global, passionate group of crypto developers and enthusiasts. The official channels below provide a great forum for connecting and engaging with the community.
                        </Paragraph>
                        <LinkWrap>
                            <Button
                                to="#"
                                isWithArrow={true}
                                isAccentColor={true}
                            >
                                Join the 0x community
                            </Button>
                        </LinkWrap>
                    </Column>
                </Section>

                <EventsWrapper bgColor={colors.backgroundLight} isFullWidth={true} isCentered={true} isTextCentered={true}>
                    <Column maxWidth="720px">
                        <Heading size="medium" asElement="h2" isCentered={true} maxWidth="507px" marginBottom="30px">
                            Upcoming Events
                        </Heading>
                        <Paragraph size="medium" isCentered={true} isMuted={true}>
                            0x meetups happen all over the world on a monthly basis and are hosted by devoted members of the community. Want to host a meetup in your city? Reach out for help finding a venue, connecting with local 0x mentors, and promoting your events.
                        </Paragraph>
                        <LinkWrap>
                            <Button
                                to="#"
                                isWithArrow={true}
                                isAccentColor={true}
                            >
                                Get in Touch
                            </Button>
                            <Button
                                to="#"
                                isWithArrow={true}
                                isAccentColor={true}
                            >
                                Join Newsletter
                            </Button>
                        </LinkWrap>
                    </Column>
                    <WrapGrid isTextCentered={true} isWrapped={true} isFullWidth={false} isCentered={false} maxWidth="1149px">
                        {_.map(events, (ev: EventProps, index: number) => (
                            <Event
                                key={`event-${index}`}
                                title={ev.title}
                                date={ev.date}
                                signupUrl={ev.signupUrl}
                                imageUrl={ev.imageUrl}
                            />
                        ))}
                    </WrapGrid>
                </EventsWrapper>

                <Banner
                    heading="Ready to get started?"
                    subline="Dive into our docs, or contact us if needed"
                    mainCta={{ text: 'Get Started', href: '/docs' }}
                    secondaryCta={{ text: 'Get in Touch', onClick: this._onOpenContactModal.bind(this) }}
                />
                <ModalContact isOpen={this.state.isContactModalOpen} onDismiss={this._onDismissContactModal} />
            </SiteWrap>
        );
    }

    public _onOpenContactModal = (): void => {
        this.setState({ isContactModalOpen: true });
    }

    public _onDismissContactModal = (): void => {
        this.setState({ isContactModalOpen: false });
    }
}

const Event: React.FunctionComponent<EventProps> = (event: EventProps) => (
    <StyledEvent>
        <EventImage src={event.imageUrl} alt=""/>
        <EventContent>
            <Heading color={colors.white} size="small" marginBottom="0">
                {event.title}
            </Heading>
            <Paragraph color={colors.white} isMuted={0.65}>
                {event.date}
            </Paragraph>
            <Button
                color={colors.white}
                href={event.signupUrl}
                isWithArrow={true}
            >
                Sign Up
            </Button>
        </EventContent>
    </StyledEvent>
);

// Events
const EventsWrapper = styled(Section)`
    display: flex;
    align-items: center;
    flex-direction: column;
`;

// Event
const StyledEvent = styled.div`
    background-color: ${colors.brandDark};
    width: calc((100% / 3) - 30px);
    text-align: left;
    height: 424px;
    margin-top: 130px;
`;

const EventImage = styled.img`
    width: 100%;
    height: 260px;
    object-fit: cover;
`;

const EventContent = styled.div`
    padding: 30px 30px;
`;

// Misc
const LinkWrap = styled.div`
    display: inline-flex;
    margin-top: 60px;

    a + a {
        margin-left: 60px;
    }
`;
