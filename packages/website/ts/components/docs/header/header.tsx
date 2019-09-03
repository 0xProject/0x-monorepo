import * as React from 'react';
import Headroom from 'react-headroom';
import MediaQuery from 'react-responsive';
import styled, { css } from 'styled-components';

import { Link } from 'ts/components/documentation/shared/link';

import { MobileNav } from 'ts/components/docs/header/mobile_nav';
import { SearchInput } from 'ts/components/docs/search/search_input';

import { Hamburger } from 'ts/components/hamburger';
import { Logo } from 'ts/components/logo';
import { FlexWrap } from 'ts/components/newLayout';

import { colors } from 'ts/style/colors';
import { IThemeValuesInterface } from 'ts/style/theme';
import { zIndex } from 'ts/style/z_index';

import { WebsitePaths } from 'ts/types';

interface IHeaderProps {
    location?: Location;
    isNavToggled?: boolean;
    toggleMobileNav?: () => void;
}

interface INavLinkProps {
    link: INavItems;
    key: string;
}

interface INavItems {
    url?: string;
    id?: string;
    text?: string;
}

const navItems: INavItems[] = [
    {
        id: 'core-concepts',
        text: 'Core Concepts',
        url: WebsitePaths.DocsCoreConcepts,
    },
    {
        id: 'api-explorer',
        text: 'API Explorer',
        url: WebsitePaths.DocsApiExplorer,
    },
    {
        id: 'guides',
        text: 'Guides',
        url: WebsitePaths.DocsGuides,
    },
    {
        id: 'tools',
        text: 'Tools',
        url: WebsitePaths.DocsTools,
    },
];

export const Header: React.FC<IHeaderProps> = ({ isNavToggled, toggleMobileNav }) => {
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
                    <LogoWrap>
                        <Link to={WebsitePaths.Home}>
                            <Logo />
                        </Link>
                        <DocsLogoWrap>
                            / <DocsLogoLink to={WebsitePaths.Docs}>Docs</DocsLogoLink>
                        </DocsLogoWrap>
                    </LogoWrap>

                    <MediaQuery minWidth={1200}>
                        <NavLinks>
                            {navItems.map((link, index) => (
                                <NavItem key={`navlink-${index}`} link={link} />
                            ))}
                        </NavLinks>

                        <SearchInput isHome={false} />
                    </MediaQuery>

                    <MediaQuery maxWidth={1199}>
                        <Hamburger isOpen={isNavToggled} onClick={toggleMobileNav} />
                        <MobileNav navItems={navItems} isToggled={isNavToggled} toggleMobileNav={toggleMobileNav} />
                    </MediaQuery>
                </HeaderWrap>
            </StyledHeader>
        </Headroom>
    );
};

const NavItem: React.FC<INavLinkProps> = ({ link }) => {
    const linkElement = link.url ? (
        <StyledNavLink to={link.url}>{link.text}</StyledNavLink>
    ) : (
        <StyledAnchor href="#">{link.text}</StyledAnchor>
    );
    return <LinkWrap>{linkElement}</LinkWrap>;
};

const StyledHeader = styled.header<IHeaderProps>`
    padding: 30px;
    background-color: ${colors.backgroundLight};
`;

const DocsLogoWrap = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    font-size: var(--defaultHeading);
    color: rgba(0, 0, 0, 0.5);
    margin-left: 0.875rem;
    z-index: ${zIndex.header};
`;

const DocsLogoLink = styled(Link)`
    margin-left: 0.625rem;
`;

const LinkWrap = styled.li`
    position: relative;

    a {
        display: block;
    }

    @media (min-width: 1200px) {
        &:hover > div {
            display: block;
            visibility: visible;
            opacity: 1;
            transform: translate3d(0, 0, 0);
            transition: opacity 0.35s, transform 0.35s, visibility 0s;
        }
    }
`;

const linkStyles = css<{ theme: IThemeValuesInterface }>`
    color: ${({ theme }) => theme.textColor};
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

const LogoWrap = styled.div`
    display: flex;
    align-items: center;
`;
