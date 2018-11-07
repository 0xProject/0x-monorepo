import * as React from 'react';

import Animation from '../index';
import * as animationData from './data.json';

function AnimationTrace() {
    return <Animation animationData={animationData} width={2241} height={610} />;
}

export default AnimationTrace;
