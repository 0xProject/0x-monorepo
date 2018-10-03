import * as React from 'react';
import { Provider } from 'react-redux';

import { store } from '../redux/store';
import { theme, ThemeProvider } from '../style/theme';

export interface ZeroExInstantProps {}

export const ZeroExInstant: React.StatelessComponent<ZeroExInstantProps> = () => (
    <Provider store={store}>
        <ThemeProvider theme={theme}>
            <div> ZeroExInstant </div>
        </ThemeProvider>
    </Provider>
);
