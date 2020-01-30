import { eip712Utils } from '@0x/order-utils';
import { SignedZeroExTransaction } from '@0x/types';
import { hexUtils, signTypedDataUtils } from '@0x/utils';

export const hashUtils = {
    getApprovalHashBuffer(
        transaction: SignedZeroExTransaction,
        verifyingContract: string,
        txOrigin: string,
    ): Buffer {
        const typedData = eip712Utils.createCoordinatorApprovalTypedData(
            transaction,
            verifyingContract,
            txOrigin,
        );
        const hashBuffer = signTypedDataUtils.generateTypedDataHash(typedData);
        return hashBuffer;
    },
    getApprovalHashHex(
        transaction: SignedZeroExTransaction,
        verifyingContract: string,
        txOrigin: string,
    ): string {
        const hashHex = hexUtils.concat(
            hashUtils.getApprovalHashBuffer(transaction, verifyingContract, txOrigin),
        );
        return hashHex;
    },
};
