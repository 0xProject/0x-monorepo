import {
    constants as stakingConstants,
    GlobalStakeByStatus,
    StakeStatus,
    StakingPoolById,
    StoredBalance,
} from '@0x/contracts-staking';
import { BigNumber } from '@0x/utils';

import { Actor } from './actors/base';
import { AssertionResult } from './assertions/function_assertion';
import { BlockchainBalanceStore } from './balances/blockchain_balance_store';
import { DeploymentManager } from './deployment_manager';
import { logger } from './utils/logger';

// tslint:disable:max-classes-per-file

export class SimulationEnvironment {
    public globalStake: GlobalStakeByStatus = {
        [StakeStatus.Undelegated]: new StoredBalance(),
        [StakeStatus.Delegated]: new StoredBalance(),
    };
    public stakingPools: StakingPoolById = {};
    public currentEpoch: BigNumber = stakingConstants.INITIAL_EPOCH;

    public constructor(
        public readonly deployment: DeploymentManager,
        public balanceStore: BlockchainBalanceStore,
        public readonly actors: Actor[] = [],
    ) {
        for (const actor of actors) {
            // Set the actor's simulation environment
            actor.simulationEnvironment = this;
            // Register each actor in the balance store
            this.balanceStore.registerTokenOwner(actor.address, actor.name);
        }
    }

    public state(): any {
        return {
            globalStake: this.globalStake,
            stakingPools: this.stakingPools,
            balanceStore: this.balanceStore.toReadable(),
            currentEpoch: this.currentEpoch,
        };
    }
}

export abstract class Simulation {
    public readonly generator = this._assertionGenerator();
    public resets = false;

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
        const snapshotId = this.resets ? await this.environment.deployment.web3Wrapper.takeSnapshotAsync() : undefined;
        try {
            await this.generator.next();
        } catch (error) {
            logger.logFailure(error, this.environment.state());
            throw error;
        }
        if (snapshotId !== undefined) {
            await this.environment.deployment.web3Wrapper.revertSnapshotAsync(snapshotId);
        }
    }
}
