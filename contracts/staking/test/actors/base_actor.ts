import { StakingApiWrapper } from '../utils/api_wrapper';

export class BaseActor {
    protected readonly _owner: string;
    protected readonly _stakingApiWrapper: StakingApiWrapper;

    constructor(owner: string, stakingApiWrapper: StakingApiWrapper) {
        this._owner = owner;
        this._stakingApiWrapper = stakingApiWrapper;
    }
    public getOwner(): string {
        return this._owner;
    }
    public getStakingApiWrapper(): StakingApiWrapper {
        return this._stakingApiWrapper;
    }
}
