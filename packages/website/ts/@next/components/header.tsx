import _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Link as ReactRouterLink } from 'react-router-dom';

import { Button } from 'ts/@next/components/button';
import { Section, Wrap } from 'ts/@next/components/layout';
import { Logo } from 'ts/@next/components/logo';

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

export const Header: React.StatelessComponent<HeaderProps> = ({}) => (
      <StyledHeader>
        <HeaderWrap>
          <Link href="/next">
              <Logo/>
          </Link>

          <Links>
              {_.map(links, (link, index) => <Link key={index} href={link.url}>{link.text}</Link>)}
          </Links>
          <TradeButton href="#">Trade on 0x</TradeButton>
        </HeaderWrap>
    </StyledHeader>
);

const Link: React.StatelessComponent<LinkProps> = props => {
    const { children, href } = props;

    return (
        <StyledRouterLink to={href}>
            {children}
        </StyledRouterLink>
    );
};

const StyledHeader = Section.withComponent('header');
const HeaderWrap = styled(Wrap)`
  justify-content: space-between;
  align-items: center;
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
