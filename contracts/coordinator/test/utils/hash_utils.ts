import { eip712Utils } from '@0x/order-utils';
import { constants as orderUtilsConstants } from '@0x/order-utils/lib/src/constants';
import { SignedZeroExTransaction, ZeroExTransaction } from '@0x/types';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from './index';

export const hashUtils = {
    getApprovalHashBuffer(transaction: SignedZeroExTransaction, approvalExpirationTimeSeconds: BigNumber): Buffer {
        const domain = {
            name: constants.COORDINATOR_DOMAIN_NAME,
            version: constants.COORDINATOR_DOMAIN_VERSION,
            verifyingContractAddress: transaction.verifyingContractAddress,
        };
        const transactionHash = hashUtils.getTransactionHashHex(transaction);
        const approval = {
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
    getApprovalHashHex(transaction: SignedZeroExTransaction, approvalExpirationTimeSeconds: BigNumber): string {
        const hashHex = `0x${hashUtils
            .getApprovalHashBuffer(transaction, approvalExpirationTimeSeconds)
            .toString('hex')}`;
        return hashHex;
    },
    getTransactionHashBuffer(transaction: ZeroExTransaction | SignedZeroExTransaction): Buffer {
        const domain = {
            name: constants.COORDINATOR_DOMAIN_NAME,
            version: constants.COORDINATOR_DOMAIN_VERSION,
            verifyingContractAddress: transaction.verifyingContractAddress,
        };
        const normalizedTransaction = _.mapValues(transaction, value => {
            return !_.isString(value) ? value.toString() : value;
        });
        const typedData = eip712Utils.createTypedData(
            orderUtilsConstants.EXCHANGE_ZEROEX_TRANSACTION_SCHEMA.name,
            { ZeroExTransaction: orderUtilsConstants.EXCHANGE_ZEROEX_TRANSACTION_SCHEMA.parameters },
            normalizedTransaction,
            domain,
        );
        const hashBuffer = signTypedDataUtils.generateTypedDataHash(typedData);
        return hashBuffer;
    },
    getTransactionHashHex(transaction: ZeroExTransaction | SignedZeroExTransaction): string {
        const hashHex = `0x${hashUtils.getTransactionHashBuffer(transaction).toString('hex')}`;
        return hashHex;
    },
};
