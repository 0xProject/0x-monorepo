import { GlobalStakeByStatus, StakeStatus, StakingPoolById, StoredBalance } from '@0x/contracts-staking';
import * as _ from 'lodash';

import { Maker } from './actors/maker';
import { AssertionResult } from './assertions/function_assertion';
import { BlockchainBalanceStore } from './balances/blockchain_balance_store';
import { DeploymentManager } from './deployment_manager';

// tslint:disable:max-classes-per-file

export class SimulationEnvironment {
    public globalStake: GlobalStakeByStatus = {
        [StakeStatus.Undelegated]: new StoredBalance(),
        [StakeStatus.Delegated]: new StoredBalance(),
    };
    public stakingPools: StakingPoolById = {};

    public constructor(
        public readonly deployment: DeploymentManager,
        public balanceStore: BlockchainBalanceStore,
        public marketMakers: Maker[] = [],
    ) {}
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
