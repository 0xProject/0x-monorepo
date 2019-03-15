import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { Icon } from 'ts/components/icon';
import { ModalContact } from 'ts/components/modals/modal_contact';
import { Column, Section, WrapGrid } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';

interface EventProps {
    title: string;
    date: string;
    signupUrl: string;
    imageUrl: string;
}

interface CommunityLinkProps {
    bgColor: string;
    title?: string;
    icon?: string;
    url: string;
}

const events: EventProps[] = [
    {
        title: '0x London Meetup',
        date: 'October 20th 2018',
        imageUrl: '/images/events/london.jpg',
        signupUrl: '#',
    },
    {
        title: '0x Berlin Meetup',
        date: 'October 20th 2018',
        imageUrl: '/images/events/berlin.jpg',
        signupUrl: '#',
    },
    {
        title: '0x San Francisco Meetup',
        date: 'October 20th 2018',
        imageUrl: '/images/events/sf.jpg',
        signupUrl: '#',
    },
];
const communityLinks: CommunityLinkProps[] = [
    {
        bgColor: '#1DA1F2',
        title: 'Twitter',
        icon: 'social-twitter',
        url: 'https://twitter.com/0xProject',
    },
    {
        bgColor: '#FF4500',
        title: 'Reddit',
        icon: 'social-reddit',
        url: 'https://twitter.com/0xProject',
    },
    {
        bgColor: '#7289DA',
        title: 'Twitter',
        icon: 'social-discord',
        url: 'https://twitter.com/0xProject',
    },
    {
        bgColor: '#3B5998',
        title: 'Facebook',
        icon: 'social-fb',
        url: 'https://twitter.com/0xProject',
    },
    {
        bgColor: '#181717',
        title: 'GitHub',
        icon: 'social-github',
        url: 'https://twitter.com/0xProject',
    },
    {
        bgColor: '#003831',
        title: 'Newsletter',
        icon: 'social-newsletter',
        url: 'https://twitter.com/0xProject',
    },
];

interface Props {
    location: Location;
}

export class NextCommunity extends React.Component<Props> {
    public state = {
        isContactModalOpen: false,
    };
    public componentDidMount(): void {
        if ('URLSearchParams' in window) {
            const urlParams = new URLSearchParams(this.props.location.search);
            const modal = urlParams.get('modal');
            if (modal) {
                this.setState({ isContactModalOpen: true });
            }
        }
    }
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <Section isTextCentered={true}>
                    <Column>
                        <Heading size="medium" isCentered={true}>
                            Community
                        </Heading>
                        <Paragraph size="medium" isCentered={true} isMuted={true} marginBottom="0">
                            The 0x community is a global, passionate group of crypto developers and enthusiasts. The
                            official channels below provide a great forum for connecting and engaging with the
                            community.
                        </Paragraph>
                        <LinkWrap>
                            <Button to="#" isWithArrow={true} isAccentColor={true}>
                                Join the 0x community
                            </Button>
                        </LinkWrap>
                    </Column>
                </Section>

                <Section isFullWidth={true}>
                    <WrapGrid
                        isTextCentered={true}
                        isWrapped={true}
                        isFullWidth={false}
                        isCentered={false}
                        maxWidth="1151px"
                    >
                        {_.map(communityLinks, (link: CommunityLinkProps, index: number) => (
                            <CommunityLink
                                key={`cl-${index}`}
                                icon={link.icon}
                                title={link.title}
                                bgColor={link.bgColor}
                                url={link.url}
                            />
                        ))}
                    </WrapGrid>
                </Section>

                <EventsWrapper
                    bgColor={colors.backgroundLight}
                    isFullWidth={true}
                    isCentered={true}
                    isTextCentered={true}
                >
                    <Column maxWidth="720px">
                        <Heading size="medium" asElement="h2" isCentered={true} maxWidth="507px" marginBottom="30px">
                            Upcoming Events
                        </Heading>
                        <Paragraph size="medium" isCentered={true} isMuted={true}>
                            0x meetups happen all over the world on a monthly basis and are hosted by devoted members of
                            the community. Want to host a meetup in your city? Reach out for help finding a venue,
                            connecting with local 0x mentors, and promoting your events.
                        </Paragraph>
                        <LinkWrap>
                            <Button to="#" isWithArrow={true} isAccentColor={true}>
                                Get in Touch
                            </Button>
                            <Button to="#" isWithArrow={true} isAccentColor={true}>
                                Join Newsletter
                            </Button>
                        </LinkWrap>
                    </Column>
                    <WrapGrid
                        isTextCentered={true}
                        isWrapped={true}
                        isFullWidth={false}
                        isCentered={false}
                        maxWidth="1149px"
                    >
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
    };

    public _onDismissContactModal = (): void => {
        this.setState({ isContactModalOpen: false });
    };
}

const Event: React.FunctionComponent<EventProps> = (event: EventProps) => (
    <StyledEvent>
        <EventIcon name="logo-mark" size={30} margin={0} />
        <EventImage src={event.imageUrl} alt="" />
        <EventContent>
            <Heading color={colors.white} size="small" marginBottom="0">
                {event.title}
            </Heading>
            <Paragraph color={colors.white} isMuted={0.65}>
                {event.date}
            </Paragraph>
            <Button color={colors.white} href={event.signupUrl} isWithArrow={true}>
                Sign Up
            </Button>
        </EventContent>
    </StyledEvent>
);

const CommunityLink: React.FunctionComponent<CommunityLinkProps> = (props: CommunityLinkProps) => (
    <StyledCommunityLink bgColor={props.bgColor} href={props.url}>
        <CommunityIcon name={props.icon} size={44} margin={0} />
        <CommunityTitle color={colors.white} isMuted={false} marginBottom="0">
            {props.title}
        </CommunityTitle>
    </StyledCommunityLink>
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
    position: relative;
`;

const EventIcon = styled(Icon)`
    position: absolute;
    top: 30px;
    left: 30px;
`;

const EventImage = styled.img`
    width: 100%;
    height: 260px;
    object-fit: cover;
`;

const EventContent = styled.div`
    padding: 30px 30px;
`;

interface StyledCommunityLinkProps {
    bgColor: string;
}
const StyledCommunityLink = styled.a`
    background-color: ${(props: StyledCommunityLinkProps) => props.bgColor};
    color: ${colors.white};
    width: 175px;
    height: 175px;
    text-align: center;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const CommunityTitle = styled(Paragraph)`
    font-size: 20px;
    font-weight: 400;
`;

const CommunityIcon = styled(Icon)`
    margin-bottom: 20px;
`;

// Misc
const LinkWrap = styled.div`
    display: inline-flex;
    margin-top: 60px;

    a + a {
        margin-left: 60px;
    }
`;
