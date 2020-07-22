import { BalancerPool, BalancerPoolsCache } from '../../src/utils/market_operation_utils/balancer_utils';

export interface Handlers {
    getPoolsForPairAsync: (takerToken: string, makerToken: string) => Promise<BalancerPool[]>;
    _fetchPoolsForPairAsync: (takerToken: string, makerToken: string) => Promise<BalancerPool[]>;
}

export class MockBalancerPoolsCache extends BalancerPoolsCache {
    constructor(public handlers: Partial<Handlers>) {
        super();
    }

    public async getPoolsForPairAsync(takerToken: string, makerToken: string): Promise<BalancerPool[]> {
        return this.handlers.getPoolsForPairAsync
            ? this.handlers.getPoolsForPairAsync(takerToken, makerToken)
            : super.getPoolsForPairAsync(takerToken, makerToken);
    }

    protected async _fetchPoolsForPairAsync(takerToken: string, makerToken: string): Promise<BalancerPool[]> {
        return this.handlers._fetchPoolsForPairAsync
            ? this.handlers._fetchPoolsForPairAsync(takerToken, makerToken)
            : super._fetchPoolsForPairAsync(takerToken, makerToken);
    }
}
