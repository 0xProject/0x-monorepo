import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { constants } from '../constants';

export const utils = {
    numberPercentageToEtherTokenAmountPercentage(percentage: number): BigNumber {
        return Web3Wrapper.toBaseUnitAmount(constants.ONE_AMOUNT, constants.ETHER_TOKEN_DECIMALS).multipliedBy(
            percentage,
        );
    },
};
