import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

export interface AbiDecodedFillOrderData {
    order: SignedOrder;
    takerAssetFillAmount: BigNumber;
    signature: string;
}
