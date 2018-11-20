import * as React from 'react';

import { BaseAnimation } from '../index';

import * as animationData from './data.json';

const ProfilerAnimation: React.StatelessComponent<{}> = () => (
    <BaseAnimation animationData={animationData} width={1985} height={657} />
);

export { ProfilerAnimation };
