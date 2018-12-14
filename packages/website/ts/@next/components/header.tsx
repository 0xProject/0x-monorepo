import _ from 'lodash';
import * as React from 'react';
import MediaQuery from 'react-responsive';
import { Link as ReactRouterLink } from 'react-router-dom';
import styled, { withTheme } from 'styled-components';

import { Button } from 'ts/@next/components/button';
import { DropdownDevelopers } from 'ts/@next/components/dropdowns/dropdown_developers';
import { DropdownProducts } from 'ts/@next/components/dropdowns/dropdown_products';
import { Hamburger } from 'ts/@next/components/hamburger';
import { Logo } from 'ts/@next/components/logo';
import { MobileNav } from 'ts/@next/components/mobileNav';
import { FlexWrap } from 'ts/@next/components/newLayout';
import { ThemeInterface } from 'ts/@next/components/siteWrap';
import { Paragraph } from 'ts/@next/components/text';

interface HeaderProps {
    isOpen?: boolean;
    location?: Location;
    isNavToggled?: boolean;
    toggleMobileNav?: () => void;
    theme: ThemeInterface;
}

interface HeaderState {
    isOpen: boolean;
}

interface NavItem {
    url?: string;
    id?: string;
    text?: string;
    dropdownWidth?: number;
    dropdownComponent?: React.ReactNode;
}

interface DropdownWrapInterface {
    width?: number;
}

const mobileProductLinks = [
    { url: '/next/0x-instant', text: '0x Instant' },
    { url: '/next/launch-kit', text: '0x Launch Kit' },
];

const navItems: NavItem[] = [
    {
        id: 'why',
        url: '/next/why',
        text: 'Why 0x',
    },
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
        dropdownWidth: 480,
    },
    {
        id: 'about',
        url: '/next/about/mission',
        text: 'About',
    },
    {
        id: 'blog',
        url: 'https://blog.0xproject.com/latest',
        text: 'Blog',
    },
];

class HeaderBase extends React.Component<HeaderProps, HeaderState> {
    public state = {
        isOpen: false,
    };

    public onMenuButtonClick = (): void => {
        this.setState({
            isOpen: !this.state.isOpen,
        });
    }

    public render(): React.ReactNode {
        const { isOpen } = this.state;
        const { isNavToggled, toggleMobileNav, theme } = this.props;

        return (
            <StyledHeader isOpen={isOpen}>
                <HeaderWrap>
                    <ReactRouterLink to="/next">
                        <Logo />
                    </ReactRouterLink>

                    <NavLinks>
                        {_.map(navItems, (link, index) => (
                            <NavItem
                                key={`navlink-${index}`}
                                link={link}
                                index={index}
                            />
                        ))}
                    </NavLinks>

                    <MediaQuery minWidth={990}>
                        <TradeButton
                            bgColor={theme.headerButtonBg}
                            color="#ffffff"
                            href="https://0xproject.com/portal"
                        >
                            Trade on 0x
                        </TradeButton>
                    </MediaQuery>

                    <Hamburger isOpen={isOpen} onClick={toggleMobileNav}/>
                    <MobileNav isToggled={isNavToggled} toggleMobileNav={toggleMobileNav} />
                </HeaderWrap>
            </StyledHeader>
        );
    }
}

export const Header = withTheme(HeaderBase);

const NavItem = (props: { link: NavItem; key: string }): React.ReactNode => {
    const { link } = props;
    const Subnav = link.dropdownComponent;

    return (
        <LinkWrap>
            <StyledNavLink to={link.url}>
                {link.text}
            </StyledNavLink>

            {link.dropdownComponent &&
                <DropdownWrap width={link.dropdownWidth}>
                    <Subnav />
                </DropdownWrap>
            }
        </LinkWrap>
    );
};

const StyledHeader = styled.header<HeaderProps>`
    padding: 30px;

    @media (max-width: 800px) {
        min-height: ${props => props.isOpen ? '385px' : '70px'};
        overflow: hidden;
        position: relative;
        transition: min-height 0.25s ease-in-out;
    }
`;

const LinkWrap = styled.li`
    position: relative;

    a {
        display: block;
    }

    @media (min-width: 800px) {
        &:hover > div {
            display: block;
            visibility: visible;
            opacity: 1;
            transform: translate3d(0, 0, 0);
            transition: opacity 0.35s, transform 0.35s, visibility 0s;
        }
    }
`;

const StyledNavLink = styled(ReactRouterLink).attrs({
    activeStyle: { opacity: 1 },
})`
    color: ${props => props.theme.textColor};
    opacity: 0.5;
    transition: opacity 0.35s;
    padding: 15px 0;
    margin: 0 30px;

    &:hover {
        opacity: 1;
    }
`;

const HeaderWrap = styled(FlexWrap)`
  justify-content: space-between;
  align-items: center;

  @media (max-width: 800px) {
      padding-top: 0;
      display: flex;
      padding-bottom: 0;
  }
`;

const NavLinks = styled.ul`
    display: flex;
    align-items: center;
    justify-content: space-between;

    @media (max-width: 800px) {
        display: none;
    }
`;

const DropdownWrap = styled.div<DropdownWrapInterface>`
    width: ${props => props.width || 280}px;
    padding: 15px 0;
    border: 1px solid transparent;
    border-color: ${props => props.theme.dropdownBorderColor};
    background-color: ${props => props.theme.dropdownBg};
    color: ${props => props.theme.dropdownColor};
    position: absolute;
    top: 100%;
    left: calc(50% - ${props => (props.width || 280) / 2}px);
    visibility: hidden;
    opacity: 0;
    transform: translate3d(0, -10px, 0);
    transition: opacity 0.35s, transform 0.35s, visibility 0s 0.35s;
    z-index: 20;

    &:after, &:before {
    	bottom: 100%;
    	left: 50%;
    	border: solid transparent;
    	content: " ";
    	height: 0;
    	width: 0;
    	position: absolute;
    	pointer-events: none;
    }
    &:after {
    	border-color: rgba(255, 255, 255, 0);
    	border-bottom-color: ${props => props.theme.dropdownBg};
    	border-width: 10px;
    	margin-left: -10px;
    }
    &:before {
    	border-color: rgba(255, 0, 0, 0);
    	border-bottom-color: ${props => props.theme.dropdownBorderColor};
    	border-width: 11px;
    	margin-left: -11px;
    }

    @media (max-width: 768px) {
        display: none;
    }
`;

const TradeButton = styled(Button)`
    padding: 14px 22px !important;
`;
