import React, { useEffect, useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';

import { Header } from 'ts/components/docs/header';
import { Footer } from 'ts/components/footer';

import { GlobalStyles } from 'ts/constants/globalStyle';

import { colors } from 'ts/style/colors';

interface ISiteWrapProps {
    theme?: 'dark' | 'light' | 'gray';
    isFullScreen?: boolean;
    children: any;
}

interface IMainProps {
    isNavToggled: boolean;
    isFullScreen?: boolean;
}

export interface ThemeValuesInterface {
    bgColor: string;
    darkBgColor?: string;
    lightBgColor: string;
    introTextColor: string;
    textColor: string;
    paragraphColor: string;
    linkColor: string;
    mobileNavBgUpper: string;
    mobileNavBgLower: string;
    mobileNavColor: string;
    dropdownBg: string;
    dropdownButtonBg: string;
    dropdownBorderColor?: string;
    dropdownColor: string;
    headerButtonBg: string;
    footerBg: string;
    footerColor: string;
}

export interface ThemeInterface {
    [key: string]: ThemeValuesInterface;
}

export const SiteWrap: React.FC<ISiteWrapProps> = props => {
    const { children, theme = 'dark', isFullScreen } = props;
    const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

    useEffect(() => {
        document.documentElement.style.overflowY = 'auto';
        window.scrollTo(0, 0);
    }, []);

    const toggleMobileNav = () => setIsMobileNavOpen(!isMobileNavOpen);

    return (
        <ThemeProvider theme={GLOBAL_THEMES[theme]}>
            <>
                <GlobalStyles />

                <Header isNavToggled={isMobileNavOpen} toggleMobileNav={toggleMobileNav} />

                <Main isNavToggled={isMobileNavOpen} isFullScreen={isFullScreen}>
                    {children}
                </Main>

                <Footer />
            </>
        </ThemeProvider>
    );
};

const Main = styled.main<IMainProps>`
    transition: transform 0.5s, opacity 0.5s;
    opacity: ${props => props.isNavToggled && '0.5'};
    padding-bottom: 70px;

    ${props =>
        props.isFullScreen &&
        `
        display: flex;
        align-items: center;
        min-height: calc(100vh - 108px - 381px);
    `}
`;

const GLOBAL_THEMES: ThemeInterface = {
    dark: {
        bgColor: '#000000',
        darkBgColor: '#111A19',
        lightBgColor: '#003831',
        introTextColor: 'rgba(255, 255, 255, 0.75)',
        textColor: '#FFFFFF',
        paragraphColor: '#FFFFFF',
        linkColor: colors.brandLight,
        mobileNavBgUpper: '#003831',
        mobileNavBgLower: '#022924',
        mobileNavColor: '#FFFFFF',
        dropdownBg: '#111A19',
        dropdownButtonBg: '#003831',
        dropdownColor: '#FFFFFF',
        headerButtonBg: '#00AE99',
        footerBg: '#181818',
        footerColor: '#FFFFFF',
    },
    light: {
        bgColor: '#FFFFFF',
        lightBgColor: '#F3F6F4',
        darkBgColor: '#003831',
        introTextColor: 'rgba(92, 92, 92, 0.87)',
        textColor: '#000000',
        paragraphColor: '#474747',
        linkColor: colors.brandDark,
        mobileNavBgUpper: '#FFFFFF',
        mobileNavBgLower: '#F3F6F4',
        mobileNavColor: '#000000',
        dropdownBg: '#FBFBFB',
        dropdownButtonBg: '#F3F6F4',
        dropdownColor: '#003831',
        dropdownBorderColor: '#E4E4E4',
        headerButtonBg: '#003831',
        footerBg: '#F2F2F2',
        footerColor: '#000000',
    },
    gray: {
        bgColor: '#e0e0e0',
        lightBgColor: '#003831',
        introTextColor: 'rgba(92, 92, 92, 0.87)',
        textColor: '#000000',
        paragraphColor: '#777777',
        linkColor: colors.brandDark,
        mobileNavBgUpper: '#FFFFFF',
        mobileNavBgLower: '#F3F6F4',
        mobileNavColor: '#000000',
        dropdownBg: '#FFFFFF',
        dropdownButtonBg: '#F3F6F4',
        dropdownColor: '#003831',
        headerButtonBg: '#003831',
        footerBg: '#181818',
        footerColor: '#FFFFFF',
    },
};
