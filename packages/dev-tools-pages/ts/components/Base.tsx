import * as React from 'react';

import ThemeContext from 'ts/context';
import GlobalStyles from 'ts/globalStyles';
import Header from 'ts/components/Header';
import Hero from 'ts/components/Hero';
import Footer from 'ts/components/Footer';

interface BaseProps {
    context: any;
    children: React.ReactNode;
}

function Base(props: BaseProps) {
    return (
        <ThemeContext.Provider value={props.context}>
            <GlobalStyles />
            <Header />
            <Hero />
            {props.children}
            <Footer />
        </ThemeContext.Provider>
    );
}

export default Base;
