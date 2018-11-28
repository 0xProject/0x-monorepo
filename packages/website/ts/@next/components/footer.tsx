import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Button } from './button';
import { Container } from './container';
import { Logo } from './logo';

export interface FooterInterface {
}

export interface ColInterface {
    width: string | number;
}

export interface LinkInterface {
    text: string;
    url: string;
    newWindow?: boolean;
}

export interface LinkRowInterface {
    heading: string;
    links: LinkInterface[];
}

const StyledFooter = styled.footer`
    background-color: #181818;
    margin-top: 3.529411765rem; // 60px
`;

const Inner = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 2.352941176rem 3.529411765rem; // 40px 60px
    text-align: left;
`;

const Links = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Col = styled.div<ColInterface>`
    width: ${props => props.width};
`;

const Link = styled.a`
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

const RowHeading = styled.h1`
    color: ${colors.white};
    font-weight: 500;
    font-size: 16px;
    line-height: 20px;
    margin-bottom: 1.25em;
`;

const linkRows = [
    {
        heading: 'Products',
        links: [
            { url: '#', text: '0x Instant' },
            { url: '#', text: '0x Launch Kit' },
        ],
    },
    {
        heading: 'About',
        links: [
            { url: '#', text: 'Mission' },
            { url: '#', text: 'Team' },
            { url: '#', text: 'Jobs' },
            { url: '#', text: 'Press Kit' },
        ],
    },
    {
        heading: 'Community',
        links: [
            { url: '#', text: 'Twitter' },
            { url: '#', text: 'Rocket Chat' },
            { url: '#', text: 'Facebook' },
            { url: '#', text: 'Reddit' },
        ],
    },
];

const LinkRow: React.StatelessComponent<LinkRowInterface> = ({heading, links}) => (
    <Col width="33%">
        <RowHeading>{heading}</RowHeading>
        {_.map(links, (link, index) => <Link key={index} href={link.url}>{link.text}</Link>)}
    </Col>
)

export const Footer: React.StatelessComponent<FooterInterface> = ({}) => (
    <StyledFooter >
        <Container removePadding={true}>
            <Inner>
                <Col width="32%">
                    <Logo/>
                </Col>
                <Col width="46%">
                    <Links>
                        {_.map(linkRows, (row, index) => <LinkRow key={index} heading={row.heading} links={row.links} />)}
                    </Links>
                </Col>
            </Inner>
        </Container>
    </StyledFooter>
);
