import * as React from 'react';

import { ThemeProvider } from '../style/theme';

export interface ZeroExInstantProps {}

export const ZeroExInstant: React.StatelessComponent<ZeroExInstantProps> = () => (
    <ThemeProvider>
        <div> ZeroExInstant </div>
    </ThemeProvider>
);
