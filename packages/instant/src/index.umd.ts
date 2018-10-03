import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ZeroExInstant } from './index';

export interface ZeroExInstantOptions {}

export const render = (props: ZeroExInstantOptions, selector: string = '#zeroExInstantContainer') => {
    ReactDOM.render(React.createElement(ZeroExInstant, props), document.querySelector(selector));
};
