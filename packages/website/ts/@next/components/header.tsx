import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Link as ReactRouterLink } from 'react-router-dom';

import { Button } from './button';
import { Container } from './container';
import { Logo } from './logo';

interface HeaderProps {
}

interface LinkProps {
    href: string;
}

const links = [
    { url: '/next/why', text: 'Why 0x' },
    { url: '/next/0x-instant', text: 'Products' },
    { url: '#', text: 'Developers' },
    { url: '/next/about/mission', text: 'About' },
    { url: '#', text: 'Blog' },
];

const Link: React.StatelessComponent<LinkProps> = props => {
    const { children, href } = props;

    return (
        <StyledRouterLink
            to={href}
        >
            {children}
        </StyledRouterLink>
    );
};

export const Header: React.StatelessComponent<HeaderProps> = ({}) => (
    <Container>
        <StyledHeader>
            <Link href="/next">
                <Logo/>
            </Link>

            <Links>
                {_.map(links, (link, index) => <Link key={index} href={link.url}>{link.text}</Link>)}
            </Links>
            <TradeButton href="#">Trade on 0x</TradeButton>
        </StyledHeader>
    </Container>
);

const StyledHeader = styled.header`
    display: flex;
    flex-wrap: wrap;
    text-align: center;
    align-items: center;
    justify-content: space-between;
    padding: 1.666666667rem 0;
`;

const TradeButton = styled(Button)`
    @media (max-width: 999px) {
        display: none;
    }
`;

const Links = styled.div`
    display: flex;
    justify-content: space-around;
`;

const StyledRouterLink = styled(ReactRouterLink)`
    color: rgba(255, 255, 255, 0.5);
    font-size: 1rem;
    margin: 0 1.666666667em;
    transition: color 0.25s ease-in-out;
    text-decoration: none;

    &:hover {
        color: rgba(255, 255, 255, 1);
    }
`;
