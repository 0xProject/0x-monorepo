import { IERC20BridgeSamplerContract } from '@0x/contract-wrappers';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { constants as improveSwapQuoteConstants } from './constants';
import { DexSample, ERC20BridgeSource } from './types';

const { SOURCE_TO_ADDRESS } = improveSwapQuoteConstants;

export class DexOrderSampler {
    private readonly _samplerContract: IERC20BridgeSamplerContract;

    /**
     * Generate sample amounts up to `maxFillAmount`.
     */
    public static getSampleAmounts(maxFillAmount: BigNumber, numSamples: number): BigNumber[] {
        const amounts = [];
        for (let i = 0; i < numSamples; i++) {
            amounts.push(
                maxFillAmount
                    .times(i + 1)
                    .div(numSamples)
                    .integerValue(BigNumber.ROUND_UP),
            );
        }
        return amounts;
    }

    constructor(samplerContract: IERC20BridgeSamplerContract) {
        this._samplerContract = samplerContract;
    }

    public async getFillableAmountsAndSampleMarketBuyAsync(
        nativeOrders: SignedOrder[],
        sampleAmounts: BigNumber[],
        sources: ERC20BridgeSource[],
    ): Promise<[BigNumber[], DexSample[][]]> {
        const signatures = nativeOrders.map(o => o.signature);
        const [fillableAmount, rawSamples] = await this._samplerContract
            .queryOrdersAndSampleBuys(nativeOrders, signatures, sources.map(s => SOURCE_TO_ADDRESS[s]), sampleAmounts)
            .callAsync();
        const quotes = rawSamples.map((rawDexSamples, sourceIdx) => {
            const source = sources[sourceIdx];
            return rawDexSamples.map((sample, sampleIdx) => ({
                source,
                input: sampleAmounts[sampleIdx],
                output: sample,
            }));
        });
        return [fillableAmount, quotes];
    }

    public async getFillableAmountsAndSampleMarketSellAsync(
        nativeOrders: SignedOrder[],
        sampleAmounts: BigNumber[],
        sources: ERC20BridgeSource[],
    ): Promise<[BigNumber[], DexSample[][]]> {
        const signatures = nativeOrders.map(o => o.signature);
        const [fillableAmount, rawSamples] = await this._samplerContract
            .queryOrdersAndSampleSells(nativeOrders, signatures, sources.map(s => SOURCE_TO_ADDRESS[s]), sampleAmounts)
            .callAsync();
        const quotes = rawSamples.map((rawDexSamples, sourceIdx) => {
            const source = sources[sourceIdx];
            return rawDexSamples.map((sample, sampleIdx) => ({
                source,
                input: sampleAmounts[sampleIdx],
                output: sample,
            }));
        });
        return [fillableAmount, quotes];
    }
}
