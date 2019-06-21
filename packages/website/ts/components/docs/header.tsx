import { Link } from '@0x/react-shared';
import _ from 'lodash';
import * as React from 'react';
import MediaQuery from 'react-responsive';
import styled, { css, withTheme } from 'styled-components';

import Headroom from 'react-headroom';

import { SearchInput } from 'ts/components/docs/search_input';
import { Hamburger } from 'ts/components/hamburger';
import { Logo } from 'ts/components/logo';
import { MobileNav } from 'ts/components/mobileNav';
import { FlexWrap } from 'ts/components/newLayout';
import { ThemeValuesInterface } from 'ts/components/siteWrap';
import { colors } from 'ts/style/colors';
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
        text: 'Core Concepts',
    },
    {
        id: 'api-explorer',
        url: WebsitePaths.AboutMission,
        text: 'API Explorer',
    },
    {
        id: 'tutorials',
        url: WebsitePaths.AboutMission,
        text: 'Tutorials',
    },
    {
        id: 'tools',
        url: WebsitePaths.AboutMission,
        text: 'Tools',
    },
];

class HeaderBase extends React.Component<HeaderProps> {
    public onUnpin = () => {
        if (this.props.isNavToggled) {
            this.props.toggleMobileNav();
        }
    };

    public render(): React.ReactNode {
        const { isNavToggled, toggleMobileNav, theme } = this.props;

        return (
            <Headroom
                onUnpin={this.onUnpin}
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
                            <DocsLogo />
                        </LogoWrap>

                        <NavLinks>
                            {_.map(navItems, (link, index) => (
                                <NavItem key={`navlink-${index}`} link={link} />
                            ))}
                        </NavLinks>

                        <MediaQuery minWidth={990}>
                            <SearchInput isHome={false} />
                        </MediaQuery>

                        <Hamburger isOpen={isNavToggled} onClick={toggleMobileNav} />
                        <MobileNav isToggled={isNavToggled} toggleMobileNav={toggleMobileNav} />
                    </HeaderWrap>
                </StyledHeader>
            </Headroom>
        );
    }
}

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
        </LinkWrap>
    );
};

const DocsLogo = () => {
    return (
        <DocsLogoWrap>
            / <DocsLogoLink to={WebsitePaths.Docs}>Docs</DocsLogoLink>
        </DocsLogoWrap>
    );
};

const StyledHeader = styled.header<HeaderProps>`
    padding: 30px;
    background-color: ${props => colors.backgroundLight};
`;

const DocsLogoWrap = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    font-size: 1.411764706rem;
    color: rgba(0, 0, 0, 0.5);
    margin-left: 0.875rem;

    a {
        display: block;
    }
`;

const DocsLogoLink = styled(Link)`
    font-size: inherit;
    color: inherit;
    margin-left: 0.625rem;
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

const LogoWrap = styled.div`
    display: flex;
    align-items: center;
`;
