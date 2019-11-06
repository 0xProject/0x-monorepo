import { BlockchainBalanceStore } from '@0x/contracts-exchange';
import * as _ from 'lodash';

import { DeploymentManager } from '../utils/deployment_manager';
import { AssertionResult } from '../utils/function_assertions';

export interface SimulationEnvironment {
    balanceStore: BlockchainBalanceStore;
    deployment: DeploymentManager;
}

export abstract class Simulation {
    private readonly _generator = this._assertionGenerator();

    protected constructor(public readonly environment: SimulationEnvironment) {}

    public async stepAsync(): Promise<void> {
        await this._generator.next();
    }

    public async fuzzAsync(steps?: number): Promise<void> {
        if (steps !== undefined) {
            for (let i = 0; i < steps; i++) {
                await this.stepAsync();
            }
        } else {
            while (true) {
                await this.stepAsync();
            }
        }
    }

    protected abstract _assertionGenerator(): AsyncIterableIterator<AssertionResult | void>;
}
