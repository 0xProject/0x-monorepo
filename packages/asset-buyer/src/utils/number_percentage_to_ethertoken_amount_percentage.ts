import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

// HACK (xianny): copied from asset-swapper, which will replace this package
const ONE_AMOUNT = new BigNumber(1);
const ETHER_TOKEN_DECIMALS = 18;
export const numberPercentageToEtherTokenAmountPercentage = (percentage: number): BigNumber => {
    return Web3Wrapper.toBaseUnitAmount(ONE_AMOUNT, ETHER_TOKEN_DECIMALS).multipliedBy(percentage);
};
