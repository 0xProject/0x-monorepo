import * as React from 'react';
import MediaQuery from 'react-responsive';
import styled from 'styled-components';

import { Link as SmartLink } from 'ts/components/documentation/shared/link';
import { Logo } from 'ts/components/logo';
import { Column, FlexWrap, WrapGrid } from 'ts/components/newLayout';
import { NewsletterForm } from 'ts/components/newsletter_form';

import { colors } from 'ts/style/colors';
import { WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';

interface LinkInterface {
    text: string;
    url: string;
    shouldOpenInNewTab?: boolean;
}

interface LinkRows {
    heading: string;
    isOnMobile?: boolean;
    links: LinkInterface[];
}

interface LinkListProps {
    links: LinkInterface[];
}

const linkRows: LinkRows[] = [
    {
        heading: 'Products',
        isOnMobile: true,
        links: [
            { url: WebsitePaths.Instant, text: '0x Instant' },
            { url: WebsitePaths.LaunchKit, text: '0x Launch Kit' },
            { url: WebsitePaths.Extensions, text: 'Extensions' },
            { url: WebsitePaths.Vote, text: 'Governance' },
        ],
    },
    {
        heading: 'Developers',
        links: [
            { url: WebsitePaths.Docs, text: 'Documentation' },
            { url: constants.URL_GITHUB_ORG, text: 'GitHub', shouldOpenInNewTab: true },
            { url: constants.URL_PROTOCOL_SPECIFICATION, text: 'Protocol Spec', shouldOpenInNewTab: true },
        ],
    },
    {
        heading: 'About',
        isOnMobile: true,
        links: [
            { url: WebsitePaths.AboutMission, text: 'Mission' },
            { url: WebsitePaths.AboutTeam, text: 'Team' },
            { url: WebsitePaths.AboutJobs, text: 'Jobs' },
            { url: WebsitePaths.PrivacyPolicy, text: 'Privacy Policy' },
            { url: WebsitePaths.TermsOfService, text: 'Terms of Service' },
        ],
    },
    {
        heading: 'Community',
        isOnMobile: true,
        links: [
            { url: constants.URL_TWITTER, text: 'Twitter', shouldOpenInNewTab: true },
            { url: constants.URL_ZEROEX_CHAT, text: 'Discord Chat', shouldOpenInNewTab: true },
            { url: constants.URL_FACEBOOK, text: 'Facebook', shouldOpenInNewTab: true },
            { url: constants.URL_REDDIT, text: 'Reddit', shouldOpenInNewTab: true },
            { url: constants.URL_FORUM, text: 'Forum', shouldOpenInNewTab: true },
        ],
    },
];

interface IFooterProps {
    isDocs?: boolean;
}

export const Footer: React.FC<IFooterProps> = ({ isDocs }) => (
    <FooterWrap isDocs={isDocs}>
        <FlexWrap>
            <FooterColumn width="35%">
                <Logo />
                <NewsletterForm />
                <Text>Subscribe to our newsletter for updates in the 0x ecosystem</Text>
            </FooterColumn>

            <FooterColumn width="55%">
                <WrapGrid isCentered={false} isWrapped={true}>
                    {linkRows.map((row: LinkRows, index) => (
                        <MediaQuery minWidth={row.isOnMobile ? 0 : 768} key={`fc-${index}`}>
                            <FooterSectionWrap>
                                <RowHeading>{row.heading}</RowHeading>

                                <LinkList links={row.links} />
                            </FooterSectionWrap>
                        </MediaQuery>
                    ))}
                </WrapGrid>
            </FooterColumn>
        </FlexWrap>
    </FooterWrap>
);

const LinkList = (props: LinkListProps) => (
    <List>
        {props.links.map((link, index) => (
            <li key={`fl-${index}`}>
                <Link to={link.url} shouldOpenInNewTab={link.shouldOpenInNewTab}>
                    {link.text}
                </Link>
            </li>
        ))}
    </List>
);

const FooterWrap = styled.footer<IFooterProps>`
    padding: 40px 30px 30px 30px;
    margin-top: 30px;
    background-color: ${props => (props.isDocs ? colors.backgroundLight : props.theme.footerBg)};
    color: ${props => props.theme.footerColor};

    path {
        fill: ${props => props.theme.footerColor};
    }

    @media (min-width: 768px) {
        min-height: 350px;
    }
`;

const FooterColumn = styled(Column)`
    @media (min-width: 768px) {
        width: ${props => props.width};
    }

    @media (max-width: 768px) {
        text-align: left;
    }
`;

const FooterSectionWrap = styled(FooterColumn)`
    @media (max-width: 768px) {
        width: 50%;
        margin-bottom: 30px;

        & + & {
            margin-top: 0;
        }
    }
`;

const RowHeading = styled.h3`
    color: inherit;
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 1.25em;
    opacity: 0.75;
`;

const List = styled.ul`
    li + li {
        margin-top: 8px;
    }
`;

const Link = styled(SmartLink)`
    color: inherit;
    opacity: 0.5;
    display: block;
    font-size: 16px;
    line-height: 20px;
    transition: opacity 0.25s;
    text-decoration: none;

    &:hover {
        opacity: 0.8;
    }
`;

const Text = styled.p`
    color: #656565;
    font-size: 0.833333333rem;
    font-weight: 300;
    line-height: 1.2em;
    margin-top: 15px;
`;
