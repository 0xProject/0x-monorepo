import * as React from 'react';

import Animation from '../index';
import * as animationData from './data.json';

function AnimationCov() {
    return <Animation animationData={animationData} width={1981} height={660} />;
}

export default AnimationCov;
