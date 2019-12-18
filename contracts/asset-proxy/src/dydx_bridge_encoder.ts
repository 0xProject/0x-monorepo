import { AbiEncoder, BigNumber } from '@0x/utils';

export enum DydxBridgeActionType {
    Deposit,
    Withdraw,
}

export interface DydxBrigeAction {
    actionType: DydxBridgeActionType;
    accountId: BigNumber;
    marketId: BigNumber;
    conversionRateNumerator: BigNumber;
    conversionRateDenominator: BigNumber;
}

export interface DydxBridgeData {
    accountNumbers: BigNumber[];
    actions: DydxBrigeAction[];
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
                    { name: 'accountId', type: 'uint256' },
                    { name: 'marketId', type: 'uint256' },
                    { name: 'conversionRateNumerator', type: 'uint256' },
                    { name: 'conversionRateDenominator', type: 'uint256' },
                ],
            },
        ],
    },
]);