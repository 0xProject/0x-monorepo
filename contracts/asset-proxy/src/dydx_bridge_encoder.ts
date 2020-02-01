import { AbiEncoder, BigNumber } from '@0x/utils';

export enum DydxBridgeActionType {
    Deposit,
    Withdraw,
}

export interface DydxBridgeAction {
    actionType: DydxBridgeActionType;
    accountIdx: BigNumber;
    marketId: BigNumber;
    conversionRateNumerator: BigNumber;
    conversionRateDenominator: BigNumber;
}

export interface DydxBridgeData {
    accountNumbers: BigNumber[];
    actions: DydxBridgeAction[];
}

export const dydxBridgeDataEncoder = AbiEncoder.create([
    {
        name: 'bridgeData',
        type: 'tuple',
        components: [
            { name: 'accountNumbers', type: 'uint256[]' },
            {
                name: 'actions',
                type: 'tuple[]',
                components: [
                    { name: 'actionType', type: 'uint8' },
                    { name: 'accountIdx', type: 'uint256' },
                    { name: 'marketId', type: 'uint256' },
                    { name: 'conversionRateNumerator', type: 'uint256' },
                    { name: 'conversionRateDenominator', type: 'uint256' },
                ],
            },
        ],
    },
]);
