import * as React from 'react';
import { Provider } from 'react-redux';

import { store } from '../redux/store';
import { fonts } from '../style/fonts';
import { theme, ThemeProvider } from '../style/theme';

import { ZeroExInstantContainer } from './zero_ex_instant_container';

fonts.include();

export interface ZeroExInstantProps {}

export const ZeroExInstant: React.StatelessComponent<ZeroExInstantProps> = () => (
    <Provider store={store}>
        <ThemeProvider theme={theme}>
            <ZeroExInstantContainer />
        </ThemeProvider>
    </Provider>
);
