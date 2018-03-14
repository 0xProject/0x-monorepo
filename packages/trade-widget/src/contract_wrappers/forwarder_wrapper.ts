import { Order, OrderTransactionOpts, SignedOrder } from '0x.js';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as Web3 from 'web3';

import { OrderAddresses, OrderValues } from '../../../0x.js/lib/src/types';
import { artifacts } from '../artifacts';

import { ContractWrapper } from './contract_wrapper';
import { ForwarderContract } from './generated/forwarder';

export class ForwarderWrapper extends ContractWrapper {
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
        // tslint:disable-next-line:no-console
        console.log(orderAddresses, orderValues, signedOrder.ecSignature, from, orderTransactionOpts);
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
        const web3ContractInstance = await this._instantiateContractIfExistsAsync(artifacts.Forwarder);
        return web3ContractInstance.address;
    }

    private async _getForwarderContractAsync(): Promise<ForwarderContract> {
        const web3ContractInstance = await this._instantiateContractIfExistsAsync(artifacts.Forwarder);
        const contractInstance = new ForwarderContract(web3ContractInstance, this._web3Wrapper.getContractDefaults());
        return contractInstance;
    }
}
