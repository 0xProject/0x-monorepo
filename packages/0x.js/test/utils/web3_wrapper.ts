import { devConstants, web3Factory } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as Web3 from 'web3';

import { constants } from './constants';

const web3 = web3Factory.create({ shouldUseInProcessGanache: true });
const web3Wrapper = new Web3Wrapper(web3.currentProvider);

export { web3, web3Wrapper };
