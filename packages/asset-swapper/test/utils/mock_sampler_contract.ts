import { ContractFunctionObj } from '@0x/base-contract';
import { IERC20BridgeSamplerContract } from '@0x/contracts-erc20-bridge-sampler';
import { constants } from '@0x/contracts-test-utils';
import { OrderWithoutDomain } from '@0x/types';
import { BigNumber } from '@0x/utils';

export type QueryAndSampleResult = [BigNumber[], BigNumber[][]];
export type QueryAndSampleHandler = (
    orders: OrderWithoutDomain[],
    signatures: string[],
    sources: string[],
    fillAmounts: BigNumber[],
) => QueryAndSampleResult;

const DUMMY_PROVIDER = {
    sendAsync: (...args: any[]): any => {
        /* no-op */
    },
};

export class MockSamplerContract extends IERC20BridgeSamplerContract {
    public readonly queryOrdersAndSampleSellsHandler?: QueryAndSampleHandler;
    public readonly queryOrdersAndSampleBuysHandler?: QueryAndSampleHandler;

    public constructor(
        handlers?: Partial<{
            queryOrdersAndSampleSells: QueryAndSampleHandler;
            queryOrdersAndSampleBuys: QueryAndSampleHandler;
        }>,
    ) {
        super(constants.NULL_ADDRESS, DUMMY_PROVIDER);
        const _handlers = {
            queryOrdersAndSampleSells: undefined,
            queryOrdersAndSampleBuys: undefined,
            ...handlers,
        };
        this.queryOrdersAndSampleSellsHandler = _handlers.queryOrdersAndSampleSells;
        this.queryOrdersAndSampleBuysHandler = _handlers.queryOrdersAndSampleBuys;
    }

    public queryOrdersAndSampleSells(
        orders: OrderWithoutDomain[],
        signatures: string[],
        sources: string[],
        fillAmounts: BigNumber[],
    ): ContractFunctionObj<QueryAndSampleResult> {
        return {
            ...super.queryOrdersAndSampleSells(orders, signatures, sources, fillAmounts),
            callAsync: async (...args: any[]): Promise<QueryAndSampleResult> => {
                if (!this.queryOrdersAndSampleSellsHandler) {
                    throw new Error('queryOrdersAndSampleSells handler undefined');
                }
                return this.queryOrdersAndSampleSellsHandler(orders, signatures, sources, fillAmounts);
            },
        };
    }

    public queryOrdersAndSampleBuys(
        orders: OrderWithoutDomain[],
        signatures: string[],
        sources: string[],
        fillAmounts: BigNumber[],
    ): ContractFunctionObj<QueryAndSampleResult> {
        return {
            ...super.queryOrdersAndSampleBuys(orders, signatures, sources, fillAmounts),
            callAsync: async (...args: any[]): Promise<QueryAndSampleResult> => {
                if (!this.queryOrdersAndSampleBuysHandler) {
                    throw new Error('queryOrdersAndSampleBuys handler undefined');
                }
                return this.queryOrdersAndSampleBuysHandler(orders, signatures, sources, fillAmounts);
            },
        };
    }
}
