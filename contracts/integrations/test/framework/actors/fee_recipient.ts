import { BaseContract } from '@0x/base-contract';
import { ApprovalFactory, SignedCoordinatorApproval } from '@0x/contracts-coordinator';
import { SignatureType, SignedZeroExTransaction } from '@0x/types';

import { Actor, ActorConfig, Constructor } from './base';

interface FeeRecipientConfig extends ActorConfig {
    verifyingContract?: BaseContract;
}

export interface FeeRecipientInterface {
    approvalFactory?: ApprovalFactory;
    signCoordinatorApprovalAsync: (
        transaction: SignedZeroExTransaction,
        txOrigin: string,
        signatureType?: SignatureType,
    ) => Promise<SignedCoordinatorApproval>;
}

/**
 * This mixin encapsulates functionality associated with fee recipients within the 0x ecosystem.
 * As of writing, the only extra functionality provided is signing Coordinator approvals.
 */
export function FeeRecipientMixin<TBase extends Constructor>(Base: TBase): TBase & Constructor<FeeRecipientInterface> {
    return class extends Base {
        public readonly actor: Actor;
        public readonly approvalFactory?: ApprovalFactory;

        /**
         * The mixin pattern requires that this constructor uses `...args: any[]`, but this class
         * really expects a single `FeeRecipientConfig` parameter (assuming `Actor` is used as the
         * base class).
         */
        constructor(...args: any[]) {
            // tslint:disable-next-line:no-inferred-empty-object-type
            super(...args);
            this.actor = (this as any) as Actor;
            this.actor.mixins.push('FeeRecipient');

            const { verifyingContract } = args[0] as FeeRecipientConfig;
            if (verifyingContract !== undefined) {
                this.approvalFactory = new ApprovalFactory(this.actor.privateKey, verifyingContract.address);
            }
        }

        /**
         * Signs an coordinator transaction.
         */
        public async signCoordinatorApprovalAsync(
            transaction: SignedZeroExTransaction,
            txOrigin: string,
            signatureType: SignatureType = SignatureType.EthSign,
        ): Promise<SignedCoordinatorApproval> {
            if (this.approvalFactory === undefined) {
                throw new Error('No verifying contract provided in FeeRecipient constructor');
            }
            return this.approvalFactory.newSignedApproval(transaction, txOrigin, signatureType);
        }
    };
}

export class FeeRecipient extends FeeRecipientMixin(Actor) {}
