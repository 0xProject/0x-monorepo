import * as React from 'react';
import { Provider } from 'react-redux';

import { asyncData } from '../redux/async_data';
import { store } from '../redux/store';
import { fonts } from '../style/fonts';
import { theme, ThemeProvider } from '../style/theme';

import { ZeroExInstantContainer } from './zero_ex_instant_container';

fonts.include();
// tslint:disable-next-line:no-floating-promises
asyncData.fetchAndDispatchToStore();

export interface ZeroExInstantProps {}

export const ZeroExInstant: React.StatelessComponent<ZeroExInstantProps> = () => (
    <Provider store={store}>
        <ThemeProvider theme={theme}>
            <ZeroExInstantContainer />
        </ThemeProvider>
    </Provider>
);
