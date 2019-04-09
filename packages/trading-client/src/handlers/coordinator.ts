import { CoordinatorContract, CoordinatorRegistryContract, ExchangeContract } from '@0x/abi-gen-wrappers';
import { assert } from '@0x/assert';
import { ContractAddresses, getContractAddressesForNetworkOrThrow, NetworkId } from '@0x/contract-addresses';
import { Coordinator, CoordinatorRegistry, Exchange } from '@0x/contract-artifacts';
import {TransactionEncoder} from '@0x/contract-wrappers';
import { schemas } from '@0x/json-schemas';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber, fetchAsync } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider } from 'ethereum-types';

import { Request, RequestHandler } from '../index';

// copied from coordinator server
enum ExchangeMethods {
    FillOrder = 'fillOrder',
    FillOrKillOrder = 'fillOrKillOrder',
    FillOrderNoThrow = 'fillOrderNoThrow',
    CancelOrder = 'cancelOrder',
}

// copied from coordinator server
enum BatchExchangeMethods {
    BatchFillOrders = 'batchFillOrders',
    BatchFillOrKillOrders = 'batchFillOrKillOrders',
    BatchFillOrdersNoThrow = 'batchFillOrdersNoThrow',
    MarketSellOrders = 'marketSellOrders',
    MarketSellOrdersNoThrow = 'marketSellOrdersNoThrow',
    MarketBuyOrders = 'marketBuyOrders',
    MarketBuyOrdersNoThrow = 'marketBuyOrdersNoThrow',
    BatchCancelOrders = 'batchCancelOrders',
}

const networkInfoByCoordinatorAddress: {
    [coordinatorAddress: string]: {
        network: NetworkId;
        registryAddress: string;
        exchangeAddress: string;
    };
} = {};

Object.keys(NetworkId)
    .filter(k => typeof NetworkId[k as any] === 'number')
    .map(name => (NetworkId[name as any] as unknown) as NetworkId)
    .forEach(name => {
        const addresses: ContractAddresses = getContractAddressesForNetworkOrThrow(name);
        networkInfoByCoordinatorAddress[addresses.coordinator] = {
            network: name,
            registryAddress: addresses.coordinatorRegistry,
            exchangeAddress: addresses.exchange,

        };
    });

console.log(networkInfoByCoordinatorAddress);

export class CoordinatorHandler implements RequestHandler {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _coordinatorInstances: { [address: string]: CoordinatorContract } = {};
    private _coordinatorEndpoints: { [address: string]: string } = {};

    constructor(supportedProvider: SupportedProvider) {
            this._web3Wrapper = new Web3Wrapper(supportedProvider);
        }

    public canHandle(request: Request): boolean {
        const coordinatorAddresses = Object.keys(networkInfoByCoordinatorAddress);

        if (Object.values(ExchangeMethods).includes(request.methodName)) {
            const signedOrder: SignedOrder = request.arguments[0];
            try {
                assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
            } catch (e) {
                return false;
            }
            return coordinatorAddresses.includes(signedOrder.senderAddress);

        } else if (Object.values(BatchExchangeMethods).includes(request.methodName)) {
            const signedOrders: SignedOrder[] = request.arguments[0];
            try {
                assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
            } catch (e) {
                return false;
            }

            if (!isAllPropertiesUniqueInBatch(request, ['senderAddress', 'takerAddress', 'signature'])) {
                return false;
            }

            return coordinatorAddresses.includes(getPropertyFromOrders(request, 'senderAddress'));

        } else {
            return false;
        }
    }

    public async handleAsync(request: Request): Promise <string> {
        if (!this.canHandle (request) ) {
            throw new Error('invalid request');
        }

        await this.updateCoordinatorEndpointsAsync();

        const coordinatorAddress: string = getPropertyFromOrders(request, 'senderAddress');
        const coordinatorServerEndpoint = this._coordinatorEndpoints[coordinatorAddress];
        const payload = this.formatPayload(request);
        const response = await fetchAsync(coordinatorServerEndpoint, {
            body: JSON.stringify(payload),
            method: 'POST',
        });
        return 'ok';
        // if (
        //     request.methodName === ExchangeMethods.CancelOrder ||
        //     request.methodName === BatchExchangeMethods.BatchCancelOrders
        // ) {
        //     return response;
        // } else {
        //     const txData = formatTxData();
        //     const coordinatorInstance = this.getCoordinatorInstance(coordinatorAddress);
        //     const result = await sendTransactionAsync();
        //     return result;
        // }
    }

    public formatPayload(request: Request): CoordinatorServerPayload {
        return {
            signedTransaction: {
                salt: generatePseudoRandomSalt(),
                signerAddress: getPropertyFromOrders(request, 'takerAddress'),
                data: this.encodeCallData(request),
                verifyingContractAddress: getPropertyFromOrders(request, 'senderAddress'),
                signature: getPropertyFromOrders(request, 'signature'),
            },
            txOrigin: getPropertyFromOrders(request, 'takerAddress'), // the person who will eventually execute the transaction
        };
    }
    public encodeCallData(request: Request): string {
        // TODO: does callData call an exchange method e.g. fillOrder? Coordinator only has a couple methods
        // how to instantiate exchange contract?
        const coordinatorAddress = getPropertyFromOrders(request, 'senderAddress');
        const exchangeAddress = networkInfoByCoordinatorAddress[coordinatorAddress].exchangeAddress;
        const exchangeInstance = new ExchangeContract(
            Exchange.compilerOutput.abi,
            exchangeAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        const transactionEncoder = new TransactionEncoder(exchangeInstance);

        const [order, assetFillAmount] = request.arguments;
        switch (request.methodName) {
            case ExchangeMethods.FillOrder: return transactionEncoder.fillOrderTx(order, assetFillAmount);
            case ExchangeMethods.FillOrKillOrder: return transactionEncoder.fillOrKillOrderTx(order, assetFillAmount);
            case ExchangeMethods.FillOrderNoThrow: return transactionEncoder.fillOrderNoThrowTx(order, assetFillAmount);
            case ExchangeMethods.CancelOrder: return transactionEncoder.cancelOrderTx(order);
            case BatchExchangeMethods.BatchFillOrders: return transactionEncoder.batchFillOrdersTx(order, assetFillAmount);
            case BatchExchangeMethods.BatchFillOrKillOrders: return transactionEncoder.batchFillOrKillOrdersTx(order, assetFillAmount);
            case BatchExchangeMethods.BatchFillOrdersNoThrow: return transactionEncoder.batchFillOrdersNoThrowTx(order, assetFillAmount);
            case BatchExchangeMethods.MarketSellOrders: return transactionEncoder.marketSellOrdersTx(order, assetFillAmount);
            case BatchExchangeMethods.MarketSellOrdersNoThrow: return transactionEncoder.marketSellOrdersNoThrowTx(order, assetFillAmount);
            case BatchExchangeMethods.MarketBuyOrders: return transactionEncoder.marketBuyOrdersTx(order, assetFillAmount);
            case BatchExchangeMethods.MarketBuyOrdersNoThrow: return transactionEncoder.marketBuyOrdersNoThrowTx(order, assetFillAmount);
            case BatchExchangeMethods.BatchCancelOrders: return transactionEncoder.batchCancelOrdersTx(order);
            default: throw new Error('Invalid method name');

        }
    }
    public getCoordinatorInstance(address: string): CoordinatorContract {
        if (this._coordinatorInstances[address] === undefined) {
            this._coordinatorInstances[address] = new CoordinatorContract(
                Coordinator.compilerOutput.abi,
                address,
                this._web3Wrapper.getProvider(),
                this._web3Wrapper.getContractDefaults(),
            );
        }
        return this._coordinatorInstances[address];
    }
    public async updateCoordinatorEndpointsAsync(): Promise <void> {
        if (Object.keys (this._coordinatorEndpoints) !== Object.keys(networkInfoByCoordinatorAddress) ) {
            this._coordinatorEndpoints = await this._getCoordinatorEndpointsAsync();
        }
    }
    // todo: does it return all endpoints when calling await? test by calling constructor and checking for endpoints
    private async _getCoordinatorEndpointsAsync(): Promise <{ [adddress: string]: string }> {
        const result: { [adddress: string]: string } = {};
        Object.keys(networkInfoByCoordinatorAddress).forEach(async address => {
            const registryAddress = networkInfoByCoordinatorAddress[address].registryAddress;
            const registryInstance = new CoordinatorRegistryContract(
                CoordinatorRegistry.compilerOutput.abi,
                registryAddress,
                this._web3Wrapper.getProvider(),
                this._web3Wrapper.getContractDefaults(),
            );
            const endpoint = await registryInstance.getCoordinatorEndpoint.callAsync(address, {});
            result[address] = endpoint;
        });
        return result;
    }
}

interface CoordinatorServerPayload {
    signedTransaction: {
        salt: BigNumber;
        signerAddress: string;
        data: string;
        verifyingContractAddress: string;
        signature: string;
    };
    txOrigin: string;
}

function handleServerResponse(response: Response): string {
    return '';
}

function getPropertyFromOrders(request: Request, prop: keyof SignedOrder): string {
    if (Object.values(ExchangeMethods).includes(request.methodName)) {
        return request.arguments[0][prop];
    } else if (Object.values(BatchExchangeMethods).includes(request.methodName)) {
        return request.arguments[0][0][prop];
    } else {
        return '';
    }
}

function isAllPropertiesUniqueInBatch(request: Request, props: Array<keyof SignedOrder>): boolean {
    const signedOrders = request.arguments[0] as SignedOrder[];
    for (const prop of props) {
        const uniqueProp = new Set(signedOrders.map(o => o[prop]));
        if (uniqueProp.size > 1) {
            return false;
        }
    }
    return true;
}
