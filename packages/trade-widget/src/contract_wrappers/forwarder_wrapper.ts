import { Order, OrderTransactionOpts, SignedOrder } from '0x.js';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { artifacts } from '../ts/artifacts';

import { SignatureType } from '../../../contracts/lib/src/utils/types';

import { ContractWrapper } from './contract_wrapper';
import { ForwarderContract } from './generated/forwarder';

interface OrderStruct {
    makerAddress: string;
    takerAddress: string;
    makerTokenAddress: string;
    takerTokenAddress: string;
    feeRecipientAddress: string;
    makerTokenAmount: BigNumber;
    takerTokenAmount: BigNumber;
    makerFeeAmount: BigNumber;
    takerFeeAmount: BigNumber;
    expirationTimeSeconds: BigNumber;
    salt: BigNumber;
}

export interface UnsignedOrder extends OrderStruct {
    exchangeAddress: string;
}

function convertOrderToOrderStruct(order: Order): OrderStruct {
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

function convertSignature(signedOrder: SignedOrder): Buffer {
    const signature = Buffer.concat([
        ethUtil.toBuffer(SignatureType.Ecrecover),
        ethUtil.toBuffer(signedOrder.ecSignature.v),
        ethUtil.toBuffer(signedOrder.ecSignature.r),
        ethUtil.toBuffer(signedOrder.ecSignature.s),
    ]);
    return signature;
}

export class ForwarderWrapper extends ContractWrapper {
    private _forwarderContractIfExists: ForwarderContract;
    public async fillOrderAsync(
        signedOrder: SignedOrder,
        fillAmountBaseUnits: BigNumber,
        from: string,
        orderTransactionOpts: OrderTransactionOpts = {},
    ): Promise<string> {
        const forwarderInstance = await this._getForwarderContractAsync();
        // TODO remove fixed gas and gas price
        const txOpts = {
            from,
            gas: 900000,
            gasPrice: new BigNumber(1000000000),
            value: fillAmountBaseUnits,
        };
        // TODO this is likely incorrect
        const order = convertOrderToOrderStruct(signedOrder);
        const signature = convertSignature(signedOrder);
        const txHash: string = await forwarderInstance.fillOrder.sendTransactionAsync(
            order,
            `0x${signature.toString('hex')}`,
            txOpts,
        );
        return txHash;
    }

    public async getForwarderContractAddressAsync(): Promise<string> {
        const contractInstance = await this._getForwarderContractAsync();
        return contractInstance.address;
    }

    private async _getForwarderContractAsync(): Promise<ForwarderContract> {
        if (!_.isUndefined(this._forwarderContractIfExists)) {
            return this._forwarderContractIfExists;
        }
        const contractAddress = this._getContractAddress(artifacts.Forwarder);
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.Forwarder,
            contractAddress,
        );
        const contractInstance = new ForwarderContract(this._web3Wrapper, abi, address);
        this._forwarderContractIfExists = contractInstance;
        return this._forwarderContractIfExists;
    }
}
