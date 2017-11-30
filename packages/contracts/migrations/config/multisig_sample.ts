import {MultiSigConfigByNetwork} from '../../util/types';

// Make a copy of this file named `multisig.js` and input custom params as needed
export const multiSig: MultiSigConfigByNetwork = {
  kovan: {
    owners: [],
    confirmationsRequired: 0,
    secondsRequired: 0,
  },
};
