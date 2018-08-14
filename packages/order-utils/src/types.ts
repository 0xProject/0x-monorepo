import { BigNumber } from '@0xproject/utils';

export enum OrderError {
    InvalidSignature = 'INVALID_SIGNATURE',
}

export enum TradeSide {
    Maker = 'maker',
    Taker = 'taker',
}

export enum TransferType {
    Trade = 'trade',
    Fee = 'fee',
}

export interface EIP712Parameter {
    name: string;
    type: EIP712Types;
}

export interface EIP712Schema {
    name: string;
    parameters: EIP712Parameter[];
}

export enum EIP712Types {
    Address = 'address',
    Bytes = 'bytes',
    Bytes32 = 'bytes32',
    String = 'string',
    Uint256 = 'uint256',
}

export interface CreateOrderOpts {
    takerAddress?: string;
    senderAddress?: string;
    makerFee?: BigNumber;
    takerFee?: BigNumber;
    feeRecipientAddress?: string;
    salt?: BigNumber;
    expirationTimeSeconds?: BigNumber;
}
