import * as React from 'react';
import styled, { ThemeProvider } from 'styled-components';

import { colors } from 'ts/style/colors';

import { Footer } from 'ts/@next/components/footer';
import { Header } from 'ts/@next/components/header';
import { GlobalStyles } from 'ts/@next/constants/globalStyle';

// Note(ez): We'll define the theme and provide it via a prop
// e.g. theme dark/light/etc.
interface Props {
    theme?: 'dark' | 'light' | 'gray';
    children: any;
}

// we proabbly want to put this somewhere else (themes)
export interface ThemeInterface {
    [key: string]: {
        bgColor: string;
        textColor: string;
        linkColor: string;
    };
}

const GLOBAL_THEMES: ThemeInterface = {
    dark: {
        bgColor: '#000000',
        darkBgColor: '#111A19',
        lightBgColor: '#003831',
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
        textColor: '#000000',
        paragraphColor: '#777777',
        linkColor: colors.brandDark,
        dropdownBg: '#FFFFFF',
        dropdownButtonBg: '#F3F6F4',
        dropdownColor: '#003831',
        headerButtonBg: '#003831',
        footerBg: '#181818',
        footerColor: '#FFFFFF',
    },
};

export class SiteWrap extends React.Component {
    public state = {
        isMobileNavOpen: false,
    };

    public toggleMobileNav = () => {
        this.setState({
            isMobileNavOpen: !this.state.isMobileNavOpen,
        }, () => {
            const overflow = this.state.isMobileNavOpen ? 'hidden' : 'auto';
            document.documentElement.style.overflowY = overflow;
        });
    }

    public render(): React.Node {
        const {
            children,
            theme = 'dark',
        } = this.props;
        const { isMobileNavOpen } = this.state;
        const currentTheme = GLOBAL_THEMES[theme];

        return (
            <>
                <ThemeProvider theme={currentTheme}>
                    <>
                        <GlobalStyles />
                        <Header isNavToggled={isMobileNavOpen} toggleMobileNav={this.toggleMobileNav} />
                        <Main isNavToggled={isMobileNavOpen}>
                            {children}
                        </Main>
                        <Footer/>
                    </>
                </ThemeProvider>
            </>
        );
    }
}

const Main = styled.main`
    transition: transform 0.5s, opacity 0.5s;
    transform: translate3d(0, ${props => props.isNavToggled ? '357px' : 0}, 0);
    opacity: ${props => props.isNavToggled && '0.5'};
`;
