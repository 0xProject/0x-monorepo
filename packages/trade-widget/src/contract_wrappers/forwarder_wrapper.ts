import { Order, OrderTransactionOpts, SignedOrder as SignedOrderV1 } from '0x.js';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { formatters } from '../../../contracts/src/utils/formatters';
import { orderUtils } from '../../../contracts/src/utils/order_utils';
import {
    DefaultOrderParams,
    OrderStruct,
    SignatureType,
    SignedOrder,
    UnsignedOrder,
} from '../../../contracts/src/utils/types';
import { artifacts } from '../ts/artifacts';
import { Artifact } from '../ts/types';

import { ForwarderContract } from './generated/forwarder';

export function convertOrderToOrderStruct(order: Order): OrderStruct {
    return {
        makerAddress: order.maker,
        takerAddress: order.taker,
        makerTokenAddress: order.makerTokenAddress,
        takerTokenAddress: order.takerTokenAddress,
        feeRecipientAddress: order.feeRecipient,
        makerTokenAmount: order.makerTokenAmount,
        takerTokenAmount: order.takerTokenAmount,
        makerFeeAmount: order.makerFee,
        takerFeeAmount: order.takerFee,
        expirationTimeSeconds: order.expirationUnixTimestampSec,
        salt: order.salt,
    };
}

export function convertSignedOrderV1ToSignedOrderV2(signedOrderV1: SignedOrderV1): SignedOrder {
    const struct = convertOrderToOrderStruct(signedOrderV1);
    const signature = convertSignature(signedOrderV1);
    return {
        ...struct,
        exchangeAddress: signedOrderV1.exchangeContractAddress,
        signature,
    };
}

export function convertSignature(signedOrder: SignedOrderV1): string {
    const signature = Buffer.concat([
        ethUtil.toBuffer(SignatureType.Ecrecover),
        ethUtil.toBuffer(signedOrder.ecSignature.v),
        ethUtil.toBuffer(signedOrder.ecSignature.r),
        ethUtil.toBuffer(signedOrder.ecSignature.s),
    ]);
    return `0x${signature.toString('hex')}`;
}

export class ForwarderWrapper {
    private _forwarderContract: ForwarderContract;
    // TODO remove this
    public static async getForwarderContractAsync(web3Wrapper: Web3Wrapper): Promise<ForwarderContract> {
        const networkId = await web3Wrapper.getNetworkIdAsync();
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.Forwarder,
            web3Wrapper,
            networkId,
        );
        const contractInstance = new ForwarderContract(web3Wrapper, abi, address);
        return contractInstance;
    }
    protected static async _getContractAbiAndAddressFromArtifactsAsync(
        artifact: Artifact,
        web3Wrapper: Web3Wrapper,
        networkId: number,
    ): Promise<[Web3.ContractAbi, string]> {
        const contractAddress = this._getContractAddress(artifact, networkId);
        const doesContractExist = await web3Wrapper.doesContractExistAtAddressAsync(contractAddress);
        if (!doesContractExist) {
            throw new Error(`Forwarder Contract ${contractAddress} Not Found on network ${networkId}`);
        }
        const abiAndAddress: [Web3.ContractAbi, string] = [artifact.networks[networkId].abi, contractAddress];
        return abiAndAddress;
    }
    protected static _getContractAddress(artifact: Artifact, networkId: number, addressIfExists?: string): string {
        let contractAddress;
        if (_.isUndefined(addressIfExists)) {
            contractAddress = artifact.networks[networkId].address;
            if (_.isUndefined(contractAddress)) {
                throw new Error('ContractDoesNotExist');
            }
        } else {
            contractAddress = addressIfExists;
        }
        return contractAddress;
    }

    constructor(contractInstance: ForwarderContract) {
        this._forwarderContract = contractInstance;
    }
    public async fillOrdersAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        fillAmountWei: BigNumber,
        from: string,
    ): Promise<string> {
        const txOpts = {
            from,
            value: fillAmountWei,
        };
        const params = formatters.createMarketFillOrders(orders, fillAmountWei);
        const feeParams = formatters.createMarketFillOrders(feeOrders, new BigNumber(0));
        const txHash: string = await this._forwarderContract.fillOrders.sendTransactionAsync(
            params.orders,
            params.signatures,
            feeParams.orders,
            feeParams.signatures,
            txOpts,
        );
        return txHash;
    }
    public async fillOrdersFeeAsync(
        orders: SignedOrder[],
        feeOrders: SignedOrder[],
        fillAmountWei: BigNumber,
        feeProportion: number,
        feeRecipient: string,
        from: string,
    ): Promise<string> {
        const txOpts = {
            from,
            value: fillAmountWei,
        };
        const params = formatters.createMarketFillOrders(orders, fillAmountWei);
        const feeParams = formatters.createMarketFillOrders(feeOrders, new BigNumber(0));
        const txHash: string = await this._forwarderContract.fillOrdersFee.sendTransactionAsync(
            params.orders,
            params.signatures,
            feeParams.orders,
            feeParams.signatures,
            feeProportion,
            feeRecipient,
            txOpts,
        );
        return txHash;
    }
}
