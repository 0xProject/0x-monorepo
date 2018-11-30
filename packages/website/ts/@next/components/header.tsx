import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Button } from './button';
import { Container } from './container';
import { Logo } from './logo';

interface HeaderInterface {
}

const StyledHeader = styled.header`
    display: flex;
    flex-wrap: wrap;
    text-align: center;
    align-items: center;
    justify-content: space-between;
    padding: 1.666666667rem 0;
`;

const Text = styled.span`
    font-size: 1rem;
    line-height: 1.222222222em;
`;

const Links = styled.div`
    display: flex;
    justify-content: space-around;
`;

const Link = styled.a`
    color: rgba(255, 255, 255, 0.5);
    font-size: 1rem;
    margin: 0 1.666666667em;
    transition: color 0.25s ease-in-out;
    text-decoration: none;

    &:hover {
        color: rgba(255, 255, 255, 1);
    }
`;

const TradeButton = styled(Button)`
    @media (max-width: 999px) {
        display: none;
    }
`;

const links = [
    { url: '#', text: 'Why 0x' },
    { url: '#', text: 'Products' },
    { url: '#', text: 'Developers' },
    { url: '#', text: 'About' },
    { url: '#', text: 'Blog' },
];

export const Header: React.StatelessComponent<HeaderInterface> = ({}) => (
    <Container>
        <StyledHeader>
            <Logo/>
            <Links>
                {_.map(links, (link, index) => <Link key={index} href={link.url}>{link.text}</Link>)}
            </Links>
            <TradeButton href="#">Trade on 0x</TradeButton>
        </StyledHeader>
    </Container>
);
