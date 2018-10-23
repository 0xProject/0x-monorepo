import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { DEFAULT_ZERO_EX_CONTAINER_SELECTOR } from './constants';
import { ZeroExInstant, ZeroExInstantProps } from './index';

export const render = (props: ZeroExInstantProps, selector: string = DEFAULT_ZERO_EX_CONTAINER_SELECTOR) => {
    ReactDOM.render(React.createElement(ZeroExInstant, props), document.querySelector(selector));
};
