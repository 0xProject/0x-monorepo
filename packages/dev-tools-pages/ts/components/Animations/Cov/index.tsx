import * as React from 'react';

import { BaseAnimation } from '../index';

import * as animationData from './data.json';

const AnimationCov: React.StatelessComponent<{}> = () => (
    <BaseAnimation animationData={animationData} width={1981} height={660} />
);

export { AnimationCov as Animation };
