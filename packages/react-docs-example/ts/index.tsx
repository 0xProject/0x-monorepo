import 'basscss/css/basscss.css';
import 'less/all.less';
import { MuiThemeProvider } from 'material-ui/styles';
import * as React from 'react';
import { render } from 'react-dom';
import * as injectTapEventPlugin from 'react-tap-event-plugin';

import { Docs } from './docs';

injectTapEventPlugin();

render(
    <MuiThemeProvider>
        <Docs />
    </MuiThemeProvider>,
    document.getElementById('app'),
);
