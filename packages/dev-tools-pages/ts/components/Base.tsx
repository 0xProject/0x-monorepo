import * as React from 'react';
import { ThemeProvider } from 'styled-components';

import { Footer } from 'ts/components/Footer';
import { Header } from 'ts/components/Header';
import { ThemeContext } from 'ts/context';
import { GlobalStyles } from 'ts/globalStyles';

interface BaseProps {
    context: any;
    children: React.ReactNode;
}

const Base: React.StatelessComponent<BaseProps> = props => (
    <ThemeContext.Provider value={props.context}>
        <ThemeProvider theme={props.context}>
            <React.Fragment>
                <GlobalStyles />
                <Header />
                {props.children}
                <Footer />
            </React.Fragment>
        </ThemeProvider>
    </ThemeContext.Provider>
);

export { Base };
