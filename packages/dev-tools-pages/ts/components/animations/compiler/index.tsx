import * as React from 'react';

import { BaseAnimation } from '../index';

import * as animationData from './data.json';

const CompilerAnimation: React.StatelessComponent<{}> = () => (
    <BaseAnimation animationData={animationData} width={2150} height={700} />
);

export { CompilerAnimation };
