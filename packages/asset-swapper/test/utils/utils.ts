import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

const TOKEN_DECIMALS = 18;

// tslint:disable:custom-no-magic-numbers
export const baseUnitAmount = (unitAmount: number, decimals = TOKEN_DECIMALS): BigNumber => {
    return Web3Wrapper.toBaseUnitAmount(new BigNumber(unitAmount), decimals);
};
