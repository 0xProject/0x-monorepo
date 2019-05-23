import * as React from 'react';
import { ThemeProvider } from 'styled-components';

import { Footer } from 'ts/components/footer';
import { Header } from 'ts/components/header';
import { ThemeContext } from 'ts/context';
import { GlobalStyles } from 'ts/globalStyles';

interface BaseProps {
    context: any;
}

const Base: React.StatelessComponent<BaseProps> = props => (
    <ThemeContext.Provider value={props.context}>
        <ThemeProvider theme={props.context}>
            <React.Fragment>
                <GlobalStyles colors={props.context.colors} />
                <Header />
                {props.children}
                <Footer />
            </React.Fragment>
        </ThemeProvider>
    </ThemeContext.Provider>
);

export { Base };
