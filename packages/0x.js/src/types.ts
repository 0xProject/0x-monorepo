import {
    BlockParam,
    BlockParamLiteral,
    ContractAbi,
    ContractEventArg,
    ExchangeContractErrs,
    FilterObject,
    LogWithDecodedArgs,
    Order,
    OrderState,
    SignedOrder,
} from '@0xproject/types';

export enum InternalZeroExError {
    NoAbiDecoder = 'NO_ABI_DECODER',
    ZrxNotInTokenRegistry = 'ZRX_NOT_IN_TOKEN_REGISTRY',
    WethNotInTokenRegistry = 'WETH_NOT_IN_TOKEN_REGISTRY',
}

// tslint:disable:max-file-line-count
