import { BlockchainBalanceStore } from '@0x/contracts-exchange';
import { GlobalStakeByStatus, StakeStatus, StakingPoolById, StoredBalance } from '@0x/contracts-staking';
import * as _ from 'lodash';

import { AssertionResult } from '../../src/function_assertions';
import { DeploymentManager } from '../deployment_manager';

// tslint:disable:max-classes-per-file

export class SimulationEnvironment {
    public globalStake: GlobalStakeByStatus = {
        [StakeStatus.Undelegated]: new StoredBalance(),
        [StakeStatus.Delegated]: new StoredBalance(),
    };
    public stakingPools: StakingPoolById = {};

    public constructor(public readonly deployment: DeploymentManager, public balanceStore: BlockchainBalanceStore) {}
}

export abstract class Simulation {
    public readonly generator = this._assertionGenerator();

    constructor(public environment: SimulationEnvironment) {}

    public async fuzzAsync(steps?: number): Promise<void> {
        if (steps !== undefined) {
            for (let i = 0; i < steps; i++) {
                await this.generator.next();
            }
        } else {
            while (true) {
                await this.generator.next();
            }
        }
    }

    protected abstract _assertionGenerator(): AsyncIterableIterator<AssertionResult | void>;
}
