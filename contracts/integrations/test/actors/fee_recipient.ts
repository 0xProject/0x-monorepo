import { BaseContract } from '@0x/base-contract';
import { ApprovalFactory, SignedCoordinatorApproval } from '@0x/contracts-coordinator';
import { SignatureType, SignedZeroExTransaction } from '@0x/types';

import { Actor, ActorConfig, Constructor } from './base';

export interface FeeRecipientConfig extends ActorConfig {
    verifyingContract?: BaseContract;
}

export interface FeeRecipientInterface {
    approvalFactory?: ApprovalFactory;
    signCoordinatorApproval: (
        transaction: SignedZeroExTransaction,
        txOrigin: string,
        signatureType?: SignatureType,
    ) => SignedCoordinatorApproval;
}

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
            super(...args);
            this.actor = (this as any) as Actor;

            const { verifyingContract } = args[0] as FeeRecipientConfig;
            if (verifyingContract !== undefined) {
                this.approvalFactory = new ApprovalFactory(this.actor.privateKey, verifyingContract.address);
            }
        }

        /**
         * Signs an coordinator transaction.
         */
        public signCoordinatorApproval(
            transaction: SignedZeroExTransaction,
            txOrigin: string,
            signatureType: SignatureType = SignatureType.EthSign,
        ): SignedCoordinatorApproval {
            if (this.approvalFactory === undefined) {
                throw new Error('No verifying contract provided in FeeRecipient constructor');
            }
            return this.approvalFactory.newSignedApproval(transaction, txOrigin, signatureType);
        }
    };
}

export class FeeRecipient extends FeeRecipientMixin(Actor) {}
