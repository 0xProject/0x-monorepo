import _ from 'lodash';
import * as React from 'react';
import Headroom from 'react-headroom';
import { Link as ReactRouterLink } from 'react-router-dom';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Button, Link } from 'ts/@next/components/button';
import { DropdownDevelopers } from 'ts/@next/components/dropdowns/dropdown_developers';
import { DropdownProducts } from 'ts/@next/components/dropdowns/dropdown_products';
import { Dropdown } from 'ts/@next/components/dropdowns/mock';
import { Hamburger } from 'ts/@next/components/hamburger';
import { BREAKPOINTS, Section, Wrap } from 'ts/@next/components/layout';
import { Logo } from 'ts/@next/components/logo';
import { Paragraph } from 'ts/@next/components/text';

interface HeaderProps {
    isOpen: boolean;
    location?: Location;
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
        dropdownWidth: 280,
    },
    {
        id: 'developers',
        url: '#',
        text: 'Developers',
        dropdownComponent: DropdownDevelopers,
        dropdownWidth: 450,
    },
    { id: 'about', url: '/next/about/mission', text: 'About' },
    { id: 'blog', url: '#', text: 'Blog' },
];

export class Header extends React.Component<HeaderProps, HeaderState> {
    public state = {
        isOpen: false,
    };

    public onMenuButtonClick = (): void => {
        this.setState({
            isOpen: !this.state.isOpen,
        });
    }

    public getNavItem = (link: NavItem, index: number): React.ReactNode => {
        const Wrapper = link.dropdownComponent ? LinkWrap : React.Fragment;
        const Subnav = link.dropdownComponent;

        return (
            <Wrapper>
                <Link
                    key={`nav-${index}`}
                    href={link.url}
                    isTransparent={true}
                    isNoBorder={true}
                >
                    {link.text}
                </Link>

                {link.dropdownComponent &&
                    <DropdownWrap width={link.dropdownWidth}>
                        <Subnav />
                    </DropdownWrap>
                }
            </Wrapper>
        );
    }

    public render(): React.ReactNode {
        const { isOpen } = this.state;

        return (
            <Headroom>
                <StyledHeader isOpen={isOpen}>
                  <HeaderWrap>
                    <ReactRouterLink to="/next">
                        <Logo/>
                    </ReactRouterLink>

                    <Hamburger isOpen={this.state.isOpen} onClick={this.onMenuButtonClick}/>

                    <Nav>
                        <MobileProductLinksWrap>
                            {_.map(mobileProductLinks, (link, index) => (
                                <Link
                                    key={`productlink-${index}`}
                                    href={link.url}
                                    isTransparent={true}
                                    isNoBorder={true}
                                >
                                {link.text}
                                </Link>
                            ))}
                        </MobileProductLinksWrap>

                        <StyledButtonWrap>
                          {_.map(navItems, (link, index) => this.getNavItem(link, index))}
                        </StyledButtonWrap>
                    </Nav>
                    <TradeButton href="#">Trade on 0x</TradeButton>
                  </HeaderWrap>
              </StyledHeader>
            </Headroom>
      );
    }
}

const StyledHeader = styled(Section.withComponent('header'))<HeaderProps>`
    @media (max-width: ${BREAKPOINTS.mobile}) {
        min-height: ${props => props.isOpen ? '385px' : '70px'};
        overflow: hidden;
        position: relative;
        transition: min-height 0.25s ease-in-out;
    }

    @media (max-width: ${BREAKPOINTS.mobile}) {
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

const StyledButtonWrap = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    @media (max-width: ${BREAKPOINTS.mobile}) {
        background-color: #022924;
        display: flex;
        flex-wrap: wrap;
        padding: 20px 20px;

        a {
            text-align: left;
            padding-left: 0;
        }

        a + a {
            margin-left: 0;
        }
    }
`;

const MobileProductLinksWrap = styled(StyledButtonWrap)`
    display: none;

    @media (max-width: ${BREAKPOINTS.mobile}) {
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

    @media (min-width: ${BREAKPOINTS.mobile}) {
        &:hover > div {
            display: block;
            visibility: visible;
            opacity: 1;
            transform: translate3d(0, 0, 0);
            transition: opacity 0.35s, transform 0.35s, visibility 0s;
        }
    }
`;

const DropdownWrap = styled.div`
    width: ${props => props.width || 280}px;
    padding: 15px 0;
    background-color: #ffffff;
    color: #000000;
    position: absolute;
    top: 100%;
    left: calc(50% - ${props => (props.width || 280) / 2}px);
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

    @media (max-width: ${BREAKPOINTS.mobile}) {
        display: none;
    }
`;

const Nav = styled.div`
    @media (max-width: ${BREAKPOINTS.mobile}) {
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

    @media (max-width: ${BREAKPOINTS.mobile}) {
        display: none;
    }
`;
