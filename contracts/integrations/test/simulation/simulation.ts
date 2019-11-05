import { BlockchainBalanceStore } from '@0x/contracts-exchange';
import * as _ from 'lodash';

import { DeploymentManager } from '../utils/deployment_manager';
import { AssertionResult } from '../utils/function_assertions';

export abstract class Simulation {
    public poolIds = [];
    private readonly _generator = this._assertionGenerator();

    protected constructor(
        public readonly balanceStore: BlockchainBalanceStore,
        protected readonly _deployment: DeploymentManager,
    ) {}

    public async stepAsync(): Promise<void> {
        await this._generator.next();
    }

    public async fuzzAsync(steps?: number): Promise<void> {
        if (steps !== undefined) {
            _.times(steps, async () => await this.stepAsync());
        } else {
            while (true) {
                await this.stepAsync();
            }
        }
    }

    protected abstract _assertionGenerator(): AsyncIterableIterator<AssertionResult>;
}
