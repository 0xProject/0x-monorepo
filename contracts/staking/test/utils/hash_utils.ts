import { eip712Utils } from '@0x/order-utils';
import { signTypedDataUtils } from '@0x/utils';
import * as _ from 'lodash';

export const hashUtils = {
    getStakingPoolApprovalHashBuffer(
        poolId: string,
        makerAddress: string,
        verifyingContractAddress: string,
        chainId: number,
    ): Buffer {
        const typedData = eip712Utils.createStakingPoolApprovalTypedData(
            poolId,
            makerAddress,
            verifyingContractAddress,
            chainId,
        );
        const hashBuffer = signTypedDataUtils.generateTypedDataHash(typedData);
        return hashBuffer;
    },
    getStakingPoolApprovalHashHex(
        poolId: string,
        makerAddress: string,
        verifyingContractAddress: string,
        chainId: number,
    ): string {
        const hashHex = `0x${hashUtils
            .getStakingPoolApprovalHashBuffer(poolId, makerAddress, verifyingContractAddress, chainId)
            .toString('hex')}`;
        return hashHex;
    },
};
