import * as React from 'react';

import { Dispatcher } from 'ts/redux/dispatcher';
import { Translate } from 'ts/utils/translate';

export interface InstantProps {
    location: Location;
    translate: Translate;
    dispatcher: Dispatcher;
}

export const Instant: React.StatelessComponent<InstantProps> = () => <div />;
