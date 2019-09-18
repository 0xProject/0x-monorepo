import { eip712Utils } from '@0x/order-utils';
import { SignedZeroExTransaction } from '@0x/types';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as _ from 'lodash';

export const hashUtils = {
    getApprovalHashBuffer(
        transaction: SignedZeroExTransaction,
        verifyingContract: string,
        txOrigin: string,
        approvalExpirationTimeSeconds: BigNumber,
    ): Buffer {
        const typedData = eip712Utils.createCoordinatorApprovalTypedData(
            transaction,
            verifyingContract,
            txOrigin,
            approvalExpirationTimeSeconds,
        );
        const hashBuffer = signTypedDataUtils.generateTypedDataHash(typedData);
        return hashBuffer;
    },
    getApprovalHashHex(
        transaction: SignedZeroExTransaction,
        verifyingContract: string,
        txOrigin: string,
        approvalExpirationTimeSeconds: BigNumber,
    ): string {
        const hashHex = `0x${hashUtils
            .getApprovalHashBuffer(transaction, verifyingContract, txOrigin, approvalExpirationTimeSeconds)
            .toString('hex')}`;
        return hashHex;
    },
};
