import { Order, OrderTransactionOpts } from '0x.js';
import { ContractAbi } from '@0xproject/types';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { formatters } from '../../src/utils/formatters';
import { orderUtils } from '../../src/utils/order_utils';
import { ForwarderContract } from '../contract_wrappers/generated/forwarder';
// import { artifacts } from '../ts/artifacts';

import { Artifact, DefaultOrderParams, OrderStruct, SignatureType, SignedOrder, UnsignedOrder } from './types';

export class ForwarderWrapper {
    private _forwarderContract: ForwarderContract;
    // TODO remove this
    // public static async getForwarderContractAsync(web3Wrapper: Web3Wrapper): Promise<ForwarderContract> {
    //     const networkId = await web3Wrapper.getNetworkIdAsync();
    //     const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
    //         artifacts.Forwarder,
    //         web3Wrapper,
    //         networkId,
    //     );
    //     const contractInstance = new ForwarderContract(web3Wrapper, abi, address);
    //     return contractInstance;
    // }
    protected static async _getContractAbiAndAddressFromArtifactsAsync(
        artifact: Artifact,
        web3Wrapper: Web3Wrapper,
        networkId: number,
    ): Promise<[ContractAbi, string]> {
        const contractAddress = this._getContractAddress(artifact, networkId);
        const doesContractExist = await web3Wrapper.doesContractExistAtAddressAsync(contractAddress);
        if (!doesContractExist) {
            throw new Error(`Forwarder Contract ${contractAddress} Not Found on network ${networkId}`);
        }
        const abiAndAddress: [ContractAbi, string] = [artifact.networks[networkId].abi, contractAddress];
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
        const params = formatters.createMarketSellOrders(orders, fillAmountWei);
        const feeParams = formatters.createMarketSellOrders(feeOrders, new BigNumber(0));
        const txHash: string = await this._forwarderContract.buyTokens.sendTransactionAsync(
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
        const params = formatters.createMarketSellOrders(orders, fillAmountWei);
        const feeParams = formatters.createMarketSellOrders(feeOrders, new BigNumber(0));
        const txHash: string = await this._forwarderContract.buyTokensFee.sendTransactionAsync(
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
