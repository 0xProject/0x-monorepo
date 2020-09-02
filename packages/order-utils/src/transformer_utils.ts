import { Order } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import * as ethjs from 'ethereumjs-util';

import { constants } from './constants';

const { NULL_ADDRESS } = constants;

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
            { name: 'side', type: 'uint8' },
            { name: 'sellToken', type: 'address' },
            { name: 'buyToken', type: 'address' },
            {
                name: 'orders',
                type: 'tuple[]',
                components: ORDER_ABI_COMPONENTS,
            },
            { name: 'signatures', type: 'bytes[]' },
            { name: 'maxOrderFillAmounts', type: 'uint256[]' },
            { name: 'fillAmount', type: 'uint256' },
            { name: 'refundReceiver', type: 'address' },
            { name: 'rfqtTakerAddress', type: 'address' },
        ],
    },
]);

/**
 * Market operation for `FillQuoteTransformerData`.
 */
export enum FillQuoteTransformerSide {
    Sell,
    Buy,
}

/**
 * `FillQuoteTransformer.TransformData`
 */
export interface FillQuoteTransformerData {
    side: FillQuoteTransformerSide;
    sellToken: string;
    buyToken: string;
    orders: Array<Exclude<Order, ['signature', 'exchangeAddress', 'chainId']>>;
    signatures: string[];
    maxOrderFillAmounts: BigNumber[];
    fillAmount: BigNumber;
    refundReceiver: string;
    rfqtTakerAddress: string;
}

/**
 * ABI-encode a `FillQuoteTransformer.TransformData` type.
 */
export function encodeFillQuoteTransformerData(data: FillQuoteTransformerData): string {
    return fillQuoteTransformerDataEncoder.encode([data]);
}

/**
 * ABI-decode a `FillQuoteTransformer.TransformData` type.
 */
export function decodeFillQuoteTransformerData(encoded: string): FillQuoteTransformerData {
    return fillQuoteTransformerDataEncoder.decode(encoded).data;
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
 * ABI-decode a `WethTransformer.TransformData` type.
 */
export function decodeWethTransformerData(encoded: string): WethTransformerData {
    return wethTransformerDataEncoder.decode(encoded).data;
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

/**
 * ABI-decode a `PayTakerTransformer.TransformData` type.
 */
export function decodePayTakerTransformerData(encoded: string): PayTakerTransformerData {
    return payTakerTransformerDataEncoder.decode(encoded).data;
}

/**
 * ABI encoder for `PayTakerTransformer.TransformData`
 */
export const affiliateFeeTransformerDataEncoder = AbiEncoder.create({
    name: 'data',
    type: 'tuple',
    components: [
        {
            name: 'fees',
            type: 'tuple[]',
            components: [
                { name: 'token', type: 'address' },
                { name: 'amount', type: 'uint256' },
                { name: 'recipient', type: 'address' },
            ],
        },
    ],
});

/**
 * `AffiliateFeeTransformer.TransformData`
 */
export interface AffiliateFeeTransformerData {
    fees: Array<{
        token: string;
        amount: BigNumber;
        recipient: string;
    }>;
}

/**
 * ABI-encode a `AffiliateFeeTransformer.TransformData` type.
 */
export function encodeAffiliateFeeTransformerData(data: AffiliateFeeTransformerData): string {
    return affiliateFeeTransformerDataEncoder.encode(data);
}

/**
 * ABI-decode a `AffiliateFeeTransformer.TransformData` type.
 */
export function decodeAffiliateFeeTransformerData(encoded: string): AffiliateFeeTransformerData {
    return affiliateFeeTransformerDataEncoder.decode(encoded);
}

/**
 * Find the nonce for a transformer given its deployer.
 * If `deployer` is the null address, zero will always be returned.
 */
export function findTransformerNonce(
    transformer: string,
    deployer: string = NULL_ADDRESS,
    maxGuesses: number = 1024,
): number {
    if (deployer === NULL_ADDRESS) {
        return 0;
    }
    const lowercaseTransformer = transformer.toLowerCase();
    // Try to guess the nonce.
    for (let nonce = 0; nonce < maxGuesses; ++nonce) {
        const deployedAddress = getTransformerAddress(deployer, nonce);
        if (deployedAddress === lowercaseTransformer) {
            return nonce;
        }
    }
    throw new Error(`${deployer} did not deploy ${transformer}!`);
}

/**
 * Compute the deployed address for a transformer given a deployer and nonce.
 */
export function getTransformerAddress(deployer: string, nonce: number): string {
    return ethjs.bufferToHex(
        // tslint:disable-next-line: custom-no-magic-numbers
        ethjs.rlphash([deployer, nonce] as any).slice(12),
    );
}
