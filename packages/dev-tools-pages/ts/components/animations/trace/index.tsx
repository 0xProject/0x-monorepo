import * as React from 'react';

import { BaseAnimation } from '../index';

import * as animationData from './data.json';

const AnimationTrace: React.StatelessComponent<{}> = () => (
    <BaseAnimation animationData={animationData} width={2241} height={610} />
);

export { AnimationTrace as Animation };
