import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils'
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import { SignatureType } from '@0x/types';

import { StakingWrapper } from '../utils/staking_wrapper';
import { DelegatorBalances, StakerBalances } from '../utils/types';

import { BaseActor } from './base_actor';
import { SignedStakingPoolApproval } from '../utils/types';

const expect = chai.expect;

export class MakerActor extends BaseActor {
    private readonly _ownerPrivateKeyIfExists?: Buffer;
    private readonly _signatureVerifierIfExists?: string;
    private readonly _chainIdIfExists?: number;

    constructor(owner: string, stakingWrapper: StakingWrapper, ownerPrivateKey?: Buffer, signatureVerifier?: string, chainId?: number) {
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
            signatureType
        );
        return approval;
    }
}