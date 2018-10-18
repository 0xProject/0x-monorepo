import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ZeroExInstant, ZeroExInstantProps } from './index';

export const render = (props: ZeroExInstantProps, selector: string = '#zeroExInstantContainer') => {
    ReactDOM.render(React.createElement(ZeroExInstant, props), document.querySelector(selector));
};
