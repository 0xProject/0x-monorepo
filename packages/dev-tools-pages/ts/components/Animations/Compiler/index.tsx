import * as React from 'react';

import Animation from '../index';
import * as animationData from './data.json';

function AnimationCompiler() {
    return <Animation animationData={animationData} width={2150} height={700} />;
}

export default AnimationCompiler;
