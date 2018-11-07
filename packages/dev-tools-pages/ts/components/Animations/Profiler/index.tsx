import * as React from 'react';

import Animation from '../index';
import * as animationData from './data.json';

function AnimationProfiler() {
    return <Animation animationData={animationData} width={1985} height={657} />;
}

export default AnimationProfiler;
