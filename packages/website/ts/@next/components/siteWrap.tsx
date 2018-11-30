import * as React from 'react';
import styled, { ThemeProvider } from 'styled-components';

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

interface GlobalThemes {
    [key: string]: {
        bgColor: string;
        textColor: string;
    }
}

const GLOBAL_THEMES: GlobalThemes = {
    dark: {
        bgColor: '#000000',
        textColor: '#FFFFFF',
    },
    light: {
        bgColor: '#FFFFFF',
        textColor: '#000000',
    },
    gray: {
        bgColor: '#e0e0e0',
        textColor: '#000000',
    },
}

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
                        { children }
                    </Main>

                    <Footer/>
                </>
            </ThemeProvider>
        </>
    );
};
