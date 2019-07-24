import * as React from 'react';
import Headroom from 'react-headroom';
import MediaQuery from 'react-responsive';
import styled, { css, withTheme } from 'styled-components';
import { Link } from 'ts/components/documentation/shared/link';

import { Link } from '@0x/react-shared';

import { Button } from 'ts/components/button';
import { DropdownDevelopers } from 'ts/components/dropdowns/dropdown_developers';
import { DropdownProducts } from 'ts/components/dropdowns/dropdown_products';
import { DropdownResources } from 'ts/components/dropdowns/dropdown_resources';
import { Hamburger } from 'ts/components/hamburger';
import { Logo } from 'ts/components/logo';
import { MobileNav } from 'ts/components/mobileNav';
import { FlexWrap } from 'ts/components/newLayout';
import { ThemeValuesInterface } from 'ts/components/siteWrap';

import { zIndex } from 'ts/style/z_index';

import { WebsitePaths } from 'ts/types';

interface HeaderProps {
    location?: Location;
    isNavToggled?: boolean;
    toggleMobileNav?: () => void;
    theme: ThemeValuesInterface;
}

interface NavItemProps {
    url?: string;
    id?: string;
    text?: string;
    dropdownWidth?: number;
    dropdownComponent?: React.FunctionComponent<any>;
}

interface DropdownWrapInterface {
    width?: number;
}

const navItems: NavItemProps[] = [
    {
        id: 'why',
        url: WebsitePaths.Why,
        text: 'Why 0x',
    },
    {
        id: 'products',
        text: 'Products',
        dropdownComponent: DropdownProducts,
        dropdownWidth: 280,
    },
    {
        id: 'developers',
        text: 'Developers',
        dropdownComponent: DropdownDevelopers,
        dropdownWidth: 480,
    },
    {
        id: 'resources',
        text: 'Resources',
        dropdownComponent: DropdownResources,
        dropdownWidth: 270,
    },
    {
        id: 'about',
        url: WebsitePaths.AboutMission,
        text: 'About',
    },
];

export const HeaderBase: React.FC<HeaderProps> = props => {
    const { isNavToggled, toggleMobileNav, theme } = props;

    const onUnpin = () => {
        if (isNavToggled) {
            toggleMobileNav();
        }
    };

    return (
        <Headroom
            onUnpin={onUnpin}
            downTolerance={4}
            upTolerance={10}
            wrapperStyle={{ position: 'relative', zIndex: 2 }}
        >
            <StyledHeader isNavToggled={isNavToggled}>
                <HeaderWrap>
                    <Link to={WebsitePaths.Home}>
                        <Logo />
                    </Link>

                    <NavLinks>
                        {navItems.map((link, index) => (
                            <NavItem key={`navlink-${index}`} link={link} />
                        ))}
                    </NavLinks>

                    <MediaQuery minWidth={990}>
                        <TradeButton bgColor={theme.headerButtonBg} color="#ffffff" to="/explore">
                            Trade on 0x
                        </TradeButton>
                    </MediaQuery>

                    <MediaQuery maxWidth={800}>
                        <Hamburger isOpen={isNavToggled} onClick={toggleMobileNav} />
                        <MobileNav isToggled={isNavToggled} toggleMobileNav={toggleMobileNav} />
                    </MediaQuery>
                </HeaderWrap>
            </StyledHeader>
        </Headroom>
    );
};

export const Header = withTheme(HeaderBase);

const NavItem = (props: { link: NavItemProps; key: string }) => {
    const { link } = props;
    const Subnav = link.dropdownComponent;
    const linkElement =
        link.url === undefined ? (
            <StyledAnchor href="#">{link.text}</StyledAnchor>
        ) : (
            <StyledNavLink to={link.url}>{link.text}</StyledNavLink>
        );
    return (
        <LinkWrap>
            {linkElement}

            {link.dropdownComponent && (
                <DropdownWrap width={link.dropdownWidth}>
                    <Subnav />
                </DropdownWrap>
            )}
        </LinkWrap>
    );
};

const StyledHeader = styled.header<HeaderProps>`
    padding: 30px;
    background-color: ${props => props.theme.bgColor};
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

const linkStyles = css`
    color: ${props => props.theme.textColor};
    opacity: 0.5;
    transition: opacity 0.35s;
    padding: 15px 0;
    margin: 0 30px;

    &:hover {
        opacity: 1;
    }
`;

const StyledNavLink = styled(Link).attrs({
    activeStyle: { opacity: 1 },
})`
    ${linkStyles};
`;

const StyledAnchor = styled.a`
    ${linkStyles};
    cursor: default;
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
    z-index: ${zIndex.header};

    &:after,
    &:before {
        bottom: 100%;
        left: 50%;
        border: solid transparent;
        content: ' ';
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
