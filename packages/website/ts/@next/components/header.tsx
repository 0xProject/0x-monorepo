import _ from 'lodash';
import * as React from 'react';
import Headroom from 'react-headroom';
import { Link as ReactRouterLink } from 'react-router-dom';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Button, ButtonWrap, Link } from 'ts/@next/components/button';
import { DevelopersDropDown } from 'ts/@next/components/dropdowns/developers_drop_down';
import { DropdownDevelopers } from 'ts/@next/components/dropdowns/dropdown_developers';
import { DropdownProducts } from 'ts/@next/components/dropdowns/dropdown_products';
import { Dropdown } from 'ts/@next/components/dropdowns/mock';
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
    {
        id: 'products',
        url: '/next/0x-instant',
        text: 'Products',
        dropdownComponent: DropdownProducts,
    },
    {
        id: 'developers',
        url: '#',
        text: 'Developers',
        dropdownComponent: DropdownDevelopers,
    },
    { id: 'about', url: '/next/about/mission', text: 'About' },
    { id: 'blog', url: '#', text: 'Blog' },
];

export class Header extends React.Component<HeaderProps, HeaderState> {
    public state = {
        isOpen: false,
    };

    public render(): React.ReactNode {
        return (
            <Headroom>
                <StyledHeader isOpen={this.state.isOpen}>
                  <HeaderWrap>
                    <ReactRouterLink to="/next">
                        <Logo/>
                    </ReactRouterLink>

                    <Hamburger isOpen={this.state.isOpen} onClick={this._onMenuButtonClick.bind(this)}/>

                    <Nav>
                        <MobileProductLinksWrap>
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
            </Headroom>
      );
    }
    private _onMenuButtonClick(): void {
        this.setState({
            isOpen: !this.state.isOpen,
        });
    }
    private _getNavItem(link: NavItem, index: number): React.ReactNode {
        const Wrapper = link.dropdownComponent ? LinkWrap : React.Fragment;
        const Subnav = link.dropdownComponent;

        return (
            <Wrapper>
                <StyledLink
                    key={`nav-${index}`}
                    href={link.url}
                    isTransparent={true}
                    isNoBorder={true}
                >
                    {link.text}
                </StyledLink>

                {link.dropdownComponent &&
                    <DropdownWrap>
                        <Subnav />
                    </DropdownWrap>
                }
            </Wrapper>
        );
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

    @media (min-width: 768px) {
        background-color: ${props => props.theme.bgColor};
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

const LinkWrap = styled.div`
    position: relative;

    a {
        display: block;
    }

    &:hover > div {
        display: block;
        visibility: visible;
        opacity: 1;
        transform: translate3d(0, 0, 0);
        transition: opacity 0.35s, transform 0.35s, visibility 0s;
    }
`;

const DropdownWrap = styled.div`
    width: 420px;
    padding: 15px 0;
    background-color: #ffffff;
    color: #000000;
    position: absolute;
    top: 100%;
    left: calc(50% - 210px);
    visibility: hidden;
    opacity: 0;
    transform: translate3d(0, -10px, 0);
    transition: opacity 0.35s, transform 0.35s, visibility 0s 0.35s;

    &:after {
    	bottom: 100%;
    	left: 50%;
    	border: solid transparent;
    	content: " ";
    	height: 0;
    	width: 0;
    	position: absolute;
    	pointer-events: none;
    	border-color: rgba(255, 255, 255, 0);
    	border-bottom-color: #ffffff;
    	border-width: 10px;
    	margin-left: -10px;
    }
`;

const StyledLink = styled(Link)`

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
`;

const TradeButton = styled(Button)`
    padding: 14px 22px;

    @media (max-width: 768px) {
        display: none;
    }
`;
