import { constants, eip712Utils, transactionHashUtils } from '@0x/order-utils';
import { SignedZeroExTransaction, ZeroExTransaction } from '@0x/types';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as _ from 'lodash';

export const hashUtils = {
    getApprovalHashBuffer(
        transaction: SignedZeroExTransaction,
        verifyingContractAddress: string,
        txOrigin: string,
        approvalExpirationTimeSeconds: BigNumber,
    ): Buffer {
        const domain = {
            name: constants.COORDINATOR_DOMAIN_NAME,
            version: constants.COORDINATOR_DOMAIN_VERSION,
            verifyingContractAddress: verifyingContractAddress,
        };
        const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
        const approval = {
            txOrigin,
            transactionHash,
            transactionSignature: transaction.signature,
            approvalExpirationTimeSeconds: approvalExpirationTimeSeconds.toString(),
        };
        const typedData = eip712Utils.createTypedData(
            constants.COORDINATOR_APPROVAL_SCHEMA.name,
            {
                CoordinatorApproval: constants.COORDINATOR_APPROVAL_SCHEMA.parameters,
            },
            approval,
            domain,
        );
        const hashBuffer = signTypedDataUtils.generateTypedDataHash(typedData);
        return hashBuffer;
    },
    getApprovalHashHex(
        transaction: SignedZeroExTransaction,
        verifyingContractAddress: string,
        txOrigin: string,
        approvalExpirationTimeSeconds: BigNumber,
    ): string {
        const hashHex = `0x${hashUtils
            .getApprovalHashBuffer(
                transaction,
                verifyingContractAddress,
                txOrigin,
                approvalExpirationTimeSeconds,
            )
            .toString('hex')}`;
        return hashHex;
    },
};
