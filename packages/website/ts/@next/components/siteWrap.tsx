import * as React from 'react';
import { ThemeProvider } from 'styled-components';

import { colors } from 'ts/style/colors';
import { Footer } from 'ts/@next/components/footer';
import { Header } from 'ts/@next/components/header';
import { Main } from 'ts/@next/components/layout';
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
        textColor: '#FFFFFF',
        linkColor: colors.brandLight,
        dropdownBg: '#111A19',
        dropdownButtonBg: '#003831',
        dropdownColor: '#FFFFFF',
        headerButtonBg: '#00AE99',
    },
    light: {
        bgColor: '#FFFFFF',
        textColor: '#000000',
        linkColor: colors.brandDark,
        dropdownBg: '#FBFBFB',
        dropdownButtonBg: '#F3F6F4',
        dropdownColor: '#003831',
        dropdownBorderColor: '#E4E4E4',
        headerButtonBg: '#003831',
    },
    gray: {
        bgColor: '#e0e0e0',
        textColor: '#000000',
        linkColor: colors.brandDark,
        dropdownBg: '#FFFFFF',
        dropdownButtonBg: '#F3F6F4',
        dropdownColor: '#003831',
        headerButtonBg: '#003831',
    },
};

export const SiteWrap: React.StatelessComponent<Props> = props => {
    const {
        children,
        theme = 'dark',
    } = props;
    const currentTheme = GLOBAL_THEMES[theme];

    return (
        <>
            <ThemeProvider theme={currentTheme}>
                <>
                    <GlobalStyles />
                    <Header />
                    <Main>
                        {children}
                    </Main>
                    <Footer/>
                </>
            </ThemeProvider>
        </>
    );
};
