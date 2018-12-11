import * as _ from 'lodash';
import * as React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { BREAKPOINTS, Column, Section, Wrap, WrapGrid } from 'ts/@next/components/layout';
import { Logo } from 'ts/@next/components/logo';
import { NewsletterForm } from 'ts/@next/components/newsletterForm';

interface FooterInterface {
}

interface LinkInterface {
    text: string;
    url: string;
    newWindow?: boolean;
}

interface LinkRows {
    heading: string;
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
            { url: '/next/0x-instant', text: '0x Instant' },
            { url: '#', text: '0x Launch Kit' },
        ],
    },
    {
        heading: 'Developers',
        links: [
            { url: '#', text: 'Documentation' },
            { url: '#', text: 'GitHub' },
            { url: '#', text: 'Whitepaper' },
        ],
    },
    {
        heading: 'About',
        isOnMobile: true,
        links: [
            { url: '#', text: 'Mission' },
            { url: '#', text: 'Team' },
            { url: '#', text: 'Jobs' },
            { url: '#', text: 'Press Kit' },
        ],
    },
    {
        heading: 'Community',
        isOnMobile: true,
        links: [
            { url: '#', text: 'Twitter' },
            { url: '#', text: 'Rocket Chat' },
            { url: '#', text: 'Facebook' },
            { url: '#', text: 'Reddit' },
        ],
    },
];

export const Footer: React.StatelessComponent<FooterInterface> = ({}) => (
    <FooterWrap bgColor="#181818" isNoMargin={true} padding={40}>
        <Wrap>
            <FooterColumn width="35%" isNoPadding={true}>
                <Logo isLight={true} />
                <NewsletterForm />
            </FooterColumn>

            <FooterColumn width="55%" isNoPadding={true}>
                <WrapGrid isCentered={false} isWrapped={true}>
                    {_.map(linkRows, (row, index) => (
                        <FooterSectionWrap
                            key={`fc-${index}`}
                            colWidth="1/4"
                            isNoPadding={true}
                            isMobileHidden={!row.isOnMobile}
                        >
                            <RowHeading>
                                {row.heading}
                            </RowHeading>

                            <LinkList links={row.links} />
                        </FooterSectionWrap>
                    ))}
                </WrapGrid>
            </FooterColumn>
        </Wrap>
    </FooterWrap>
);

const LinkList = (props: LinkListProps) => (
  <List>
    {_.map(props.links, (link, index) => (
      <li key={`fl-${index}`}>
        <Link to={link.url}>
          {link.text}
        </Link>
      </li>
    ))}
  </List>
);

const FooterSection = Section.withComponent('footer');
const FooterWrap = styled(FooterSection)`
    color: ${colors.white};

    @media (min-width: ${BREAKPOINTS.mobile}) {
        height: 350px;
    }
`;

const FooterColumn = styled(Column)`
    @media (min-width: ${BREAKPOINTS.mobile}) {
        width: ${props => props.width};
    }

    @media (max-width: ${BREAKPOINTS.mobile}) {
        display: ${props => props.isMobileHidden && 'none'};
        text-align: left;
    }
`;

const FooterSectionWrap = styled(FooterColumn)`
    @media (max-width: ${BREAKPOINTS.mobile}) {
        width: 50%;
    }
`;

const RowHeading = styled.h3`
    color: ${colors.white};
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 1.25em;
`;

const List = styled.ul`
    li + li {
        margin-top: 8px;
    }
`;

const Link = styled(ReactRouterLink)`
    color: rgba(255, 255, 255, 0.5);
    display: block;
    font-size: 16px;
    line-height: 20px;
    transition: color 0.25s ease-in-out;
    text-decoration: none;

    &:hover {
        color: rgba(255, 255, 255, 1);
    }
`;
