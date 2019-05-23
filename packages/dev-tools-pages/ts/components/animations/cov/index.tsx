import * as React from 'react';

import { BaseAnimation } from '../index';

import * as animationData from './data.json';

const CovAnimation: React.StatelessComponent<{}> = () => (
    <BaseAnimation animationData={animationData} width={1981} height={660} />
);

export { CovAnimation };
