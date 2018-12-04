import _ from 'lodash';
import * as React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';
import styled from 'styled-components';

import { Button, ButtonWrap, Link } from 'ts/@next/components/button';
import { Section, Wrap } from 'ts/@next/components/layout';
import { Logo } from 'ts/@next/components/logo';

interface HeaderProps {
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
          <ReactRouterLink to="/next">
              <Logo/>
          </ReactRouterLink>

          <ButtonWrap>
              {_.map(links, (link, index) => (
                <Link
                    key={`hb-${index}`}
                    href={link.url}
                    isTransparent={true}
                    isNoBorder={true}
                >
                    {link.text}
                </Link>
              ))}
          </ButtonWrap>

          <Button href="#">Trade on 0x</Button>
        </HeaderWrap>
    </StyledHeader>
);

const StyledHeader = Section.withComponent('header');
const HeaderWrap = styled(Wrap)`
  justify-content: space-between;
  align-items: center;
`;
