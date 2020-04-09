import * as _ from 'lodash';

import { artifacts } from '../artifacts';

export const abis = _.mapValues(artifacts, v => v.compilerOutput.abi);
