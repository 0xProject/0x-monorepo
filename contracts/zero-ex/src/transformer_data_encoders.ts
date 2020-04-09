import { Order } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';

const ORDER_ABI_COMPONENTS = [
    { name: 'makerAddress', type: 'address' },
    { name: 'takerAddress', type: 'address' },
    { name: 'feeRecipientAddress', type: 'address' },
    { name: 'senderAddress', type: 'address' },
    { name: 'makerAssetAmount', type: 'uint256' },
    { name: 'takerAssetAmount', type: 'uint256' },
    { name: 'makerFee', type: 'uint256' },
    { name: 'takerFee', type: 'uint256' },
    { name: 'expirationTimeSeconds', type: 'uint256' },
    { name: 'salt', type: 'uint256' },
    { name: 'makerAssetData', type: 'bytes' },
    { name: 'takerAssetData', type: 'bytes' },
    { name: 'makerFeeAssetData', type: 'bytes' },
    { name: 'takerFeeAssetData', type: 'bytes' },
];

/**
 * ABI encoder for `FillQuoteTransformer.TransformData`
 */
export const fillQuoteTransformerDataEncoder = AbiEncoder.create([
    {
        name: 'data',
        type: 'tuple',
        components: [
            { name: 'sellToken', type: 'address' },
            { name: 'buyToken', type: 'address' },
            {
                name: 'orders',
                type: 'tuple[]',
                components: ORDER_ABI_COMPONENTS,
            },
            { name: 'signatures', type: 'bytes[]' },
            { name: 'maxOrderFillAmounts', type: 'uint256[]' },
            { name: 'sellAmount', type: 'uint256' },
            { name: 'buyAmount', type: 'uint256' },
        ],
    },
]);

/**
 * `FillQuoteTransformer.TransformData`
 */
export interface FillQuoteTransformerData {
    sellToken: string;
    buyToken: string;
    orders: Array<Exclude<Order, ['signature', 'exchangeAddress', 'chainId']>>;
    signatures: string[];
    maxOrderFillAmounts: BigNumber[];
    sellAmount: BigNumber;
    buyAmount: BigNumber;
}

/**
 * ABI-encode a `FillQuoteTransformer.TransformData` type.
 */
export function encodeFillQuoteTransformerData(data: FillQuoteTransformerData): string {
    return fillQuoteTransformerDataEncoder.encode([data]);
}

/**
 * ABI encoder for `WethTransformer.TransformData`
 */
export const wethTransformerDataEncoder = AbiEncoder.create([
    {
        name: 'data',
        type: 'tuple',
        components: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }],
    },
]);

/**
 * `WethTransformer.TransformData`
 */
export interface WethTransformerData {
    token: string;
    amount: BigNumber;
}

/**
 * ABI-encode a `WethTransformer.TransformData` type.
 */
export function encodeWethTransformerData(data: WethTransformerData): string {
    return wethTransformerDataEncoder.encode([data]);
}

/**
 * ABI encoder for `PayTakerTransformer.TransformData`
 */
export const payTakerTransformerDataEncoder = AbiEncoder.create([
    {
        name: 'data',
        type: 'tuple',
        components: [{ name: 'tokens', type: 'address[]' }, { name: 'amounts', type: 'uint256[]' }],
    },
]);

/**
 * `PayTakerTransformer.TransformData`
 */
export interface PayTakerTransformerData {
    tokens: string[];
    amounts: BigNumber[];
}

/**
 * ABI-encode a `PayTakerTransformer.TransformData` type.
 */
export function encodePayTakerTransformerData(data: PayTakerTransformerData): string {
    return payTakerTransformerDataEncoder.encode([data]);
}
