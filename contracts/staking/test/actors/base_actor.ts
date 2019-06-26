import { StakingWrapper } from '../utils/staking_wrapper';

export class BaseActor {
    protected readonly _owner: string;
    protected readonly _stakingWrapper: StakingWrapper;

    constructor(owner: string, stakingWrapper: StakingWrapper) {
        this._owner = owner;
        this._stakingWrapper = stakingWrapper;
    }
    public getOwner(): string {
        return this._owner;
    }
    public getStakingWrapper(): StakingWrapper {
        return this._stakingWrapper;
    }
}
