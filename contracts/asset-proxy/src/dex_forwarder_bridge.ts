import { AbiEncoder, BigNumber } from '@0x/utils';

export interface DexForwarderBridgeCall {
    target: string;
    inputTokenAmount: BigNumber;
    outputTokenAmount: BigNumber;
    bridgeData: string;
}

export interface DexForwaderBridgeData {
    inputToken: string;
    calls: DexForwarderBridgeCall[];
}

export const dexForwarderBridgeDataEncoder = AbiEncoder.create([
    { name: 'inputToken', type: 'address' },
    {
        name: 'calls',
        type: 'tuple[]',
        components: [
            { name: 'target', type: 'address' },
            { name: 'inputTokenAmount', type: 'uint256' },
            { name: 'outputTokenAmount', type: 'uint256' },
            { name: 'bridgeData', type: 'bytes' },
        ],
    },
]);
