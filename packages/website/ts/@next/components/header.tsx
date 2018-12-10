import _ from 'lodash';
import * as React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Button, ButtonWrap, Link } from 'ts/@next/components/button';
import { DevelopersDropDown } from 'ts/@next/components/dropdowns/developers_drop_down';
import { Hamburger } from 'ts/@next/components/hamburger';
import { Section, Wrap } from 'ts/@next/components/layout';
import { Logo } from 'ts/@next/components/logo';
import { Paragraph } from 'ts/@next/components/text';

interface HeaderProps {
    isOpen: boolean;
    location?: Location;
}

interface HeaderState {
    isOpen: boolean;
}

interface HeaderState {
    isOpen: boolean;
}

interface NavItem {
    url?: string;
    id?: string;
    text?: string;
}

const mobileProductLinks = [
    { url: '/next/0x-instant', text: '0x Instant' },
    { url: '/next/launch-kit', text: '0x Launch Kit' },
];

const navItems: NavItem[] = [
    { id: 'why', url: '/next/why', text: 'Why 0x' },
    { id: 'products', url: '/next/0x-instant', text: 'Products' },
    { id: 'developers', url: '#', text: 'Developers' },
    { id: 'about', url: '/next/about/mission', text: 'About' },
    { id: 'blog', url: '#', text: 'Blog' },
];

export class Header extends React.Component<HeaderProps, HeaderState> {
    constructor(props: HeaderProps) {
        super(props);
        this.state = {
            isOpen: false,
        };
    }
    public render(): React.ReactNode {
        return (
            <StyledHeader isOpen={this.state.isOpen}>
              <HeaderWrap>
                <ReactRouterLink to="/next">
                    <Logo/>
                </ReactRouterLink>
                <Hamburger isOpen={this.state.isOpen} onClick={this._onMenuButtonClick.bind(this)}/>
                <Nav>
                    <MobileProductLinksWrap>
                        <Paragraph isNoMargin={true} isMuted={0.5} size="small">Products</Paragraph>
                        {_.map(mobileProductLinks, (link, index) => (
                            <StyledLink
                                key={`productlink-${index}`}
                                href={link.url}
                                isTransparent={true}
                                isNoBorder={true}
                            >
                            {link.text}
                            </StyledLink>
                        ))}
                    </MobileProductLinksWrap>
                  <StyledButtonWrap>
                      {_.map(navItems, (link, index) => this._getNavItem(link, index))}
                  </StyledButtonWrap>
                </Nav>
                <TradeButton href="#">Trade on 0x</TradeButton>
              </HeaderWrap>
          </StyledHeader>
      );
    }
    private _onMenuButtonClick(): void {
        this.setState({
            isOpen: !this.state.isOpen,
        });
    }
    private _getNavItem(link: NavItem, index: number): React.ReactNode {
        if (link.id === 'developers') {
            return (
                <DevelopersDropDown
                    location={window.location}
                />
            );
        }

        return (
            <StyledLink
                key={`header-nav-item-${index}`}
                href={link.url}
                isTransparent={true}
                isNoBorder={true}
            >
                {link.text}
            </StyledLink>
        )
    }
}

const StyledHeader = styled(Section.withComponent('header'))<HeaderProps>`
    @media (max-width: 768px) {
        overflow: hidden;
        min-height: ${props => props.isOpen ? '385px' : '70px'};
        position: relative;
        transition: min-height 0.25s ease-in-out;
        :root & {
            padding: 20px 20px 0 !important;
        }
    }
`;

const HeaderWrap = styled(Wrap)`
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
      padding-top: 0;
      display: flex;
      padding-bottom: 0;
  }
`;

const StyledButtonWrap = styled(ButtonWrap)`
    display: flex;
    @media (max-width: 768px) {
        background-color: #022924;
        display: flex;
        flex-wrap: wrap;
        padding: 20px 20px;

        a {
            text-align: left;
            padding-left: 0;
        }
    }

    button + button,
    a + a,
    a + button,
    button + a {
        margin-left: 0;

        @media (min-width: 768px) {
            margin-left: 10px;
        }
    }
`;

const MobileProductLinksWrap = styled(StyledButtonWrap)`
    display: none;

    @media (max-width: 768px) {
        display: block;
        background-color: transparent;
        flex-direction: column;

        a {
            display: block;
            width: 100%;
        }
    }
`;

const StyledLink = styled(Link)`
    width: 50%;
    text-align: left;
    @media (max-width: 768px) {
    }

    @media (min-width: 768px) {
        width: auto;
        text-align: center;
    }
`;

const Nav = styled.div`
    @media (max-width: 768px) {
        background-color: ${colors.brandDark};
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding-top: 65px;
    }

    @media (min-width: 768px) {
        width: auto;
        text-align: center;
    }
`;

const TradeButton = styled(Button)`
    @media (max-width: 768px) {
        display: none;
    }
`;
