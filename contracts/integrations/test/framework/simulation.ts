import { GlobalStakeByStatus, StakeStatus, StakingPoolById, StoredBalance } from '@0x/contracts-staking';

import { Maker } from './actors/maker';
import { AssertionResult } from './assertions/function_assertion';
import { BlockchainBalanceStore } from './balances/blockchain_balance_store';
import { DeploymentManager } from './deployment_manager';
import { logger } from './logger';

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

    public state(): any {
        return {
            globalStake: this.globalStake,
            stakingPools: this.stakingPools,
            balanceStore: this.balanceStore.toReadable(),
        };
    }
}

export abstract class Simulation {
    public readonly generator = this._assertionGenerator();

    constructor(public environment: SimulationEnvironment) {}

    public async fuzzAsync(steps?: number): Promise<void> {
        if (steps !== undefined) {
            for (let i = 0; i < steps; i++) {
                await this._stepAsync();
            }
        } else {
            while (true) {
                await this._stepAsync();
            }
        }
    }

    protected abstract _assertionGenerator(): AsyncIterableIterator<AssertionResult | void>;

    private async _stepAsync(): Promise<void> {
        try {
            await this.generator.next();
        } catch (error) {
            logger.logFailure(error, this.environment.state());
            throw error;
        }
    }
}
