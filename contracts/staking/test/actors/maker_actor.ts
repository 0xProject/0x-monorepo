import { SignatureType } from '@0x/types';
import * as chai from 'chai';
import * as _ from 'lodash';

import { StakingWrapper } from '../utils/staking_wrapper';
import { SignedStakingPoolApproval } from '../utils/types';

import { BaseActor } from './base_actor';

const expect = chai.expect;

export class MakerActor extends BaseActor {
    private readonly _ownerPrivateKeyIfExists?: Buffer;
    private readonly _signatureVerifierIfExists?: string;
    private readonly _chainIdIfExists?: number;

    constructor(
        owner: string,
        stakingWrapper: StakingWrapper,
        ownerPrivateKey?: Buffer,
        signatureVerifier?: string,
        chainId?: number,
    ) {
        super(owner, stakingWrapper);
        this._ownerPrivateKeyIfExists = ownerPrivateKey;
        this._signatureVerifierIfExists = signatureVerifier;
        this._chainIdIfExists = chainId;
    }

    public signApprovalForStakingPool(
        poolId: string,
        signatureType: SignatureType = SignatureType.EthSign,
    ): SignedStakingPoolApproval {
        const approval = this._stakingWrapper.signApprovalForStakingPool(
            poolId,
            this._owner,
            this._ownerPrivateKeyIfExists,
            this._signatureVerifierIfExists,
            this._chainIdIfExists,
            signatureType,
        );
        return approval;
    }
}
