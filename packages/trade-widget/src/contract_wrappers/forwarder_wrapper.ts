import { Order, OrderTransactionOpts, SignedOrder } from '0x.js';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { OrderAddresses, OrderValues } from '../../../0x.js/lib/src/types';
import { artifacts } from '../artifacts';

import { ContractWrapper } from './contract_wrapper';
import { ForwarderContract } from './generated/forwarder';

export class ForwarderWrapper extends ContractWrapper {
    private _forwarderContractIfExists: ForwarderContract;
    private static _getOrderAddressesAndValues(order: Order): [OrderAddresses, OrderValues] {
        const orderAddresses: OrderAddresses = [
            order.maker,
            order.taker,
            order.makerTokenAddress,
            order.takerTokenAddress,
            order.feeRecipient,
        ];
        const orderValues: OrderValues = [
            order.makerTokenAmount,
            order.takerTokenAmount,
            order.makerFee,
            order.takerFee,
            order.expirationUnixTimestampSec,
            order.salt,
        ];
        return [orderAddresses, orderValues];
    }
    constructor(web3Wrapper: Web3Wrapper, networkId: number, abiDecoder: AbiDecoder) {
        super(web3Wrapper, networkId, abiDecoder);
    }
    public async fillOrderAsync(
        signedOrder: SignedOrder,
        fillAmountBaseUnits: BigNumber,
        from: string,
        orderTransactionOpts: OrderTransactionOpts = {},
    ): Promise<string> {
        const forwarderInstance = await this._getForwarderContractAsync();
        const [orderAddresses, orderValues] = ForwarderWrapper._getOrderAddressesAndValues(signedOrder);
        // TODO remove fixed gas and gas price
        const txHash: string = await forwarderInstance.fillOrder.sendTransactionAsync(
            orderAddresses,
            orderValues,
            signedOrder.ecSignature.v,
            signedOrder.ecSignature.r,
            signedOrder.ecSignature.s,
            {
                from,
                gas: 900000,
                gasPrice: new BigNumber(1000000000),
                value: fillAmountBaseUnits,
            },
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
