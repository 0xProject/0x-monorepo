import { OrderValidatorContract } from '@0x/abi-gen-wrappers';
import { OrderValidator } from '@0x/contract-artifacts';
import { schemas } from '@0x/json-schemas';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { BalanceAndAllowance, OrderAndTraderInfo, TraderInfo } from '../types';
import { assert } from '../utils/assert';
import { _getDefaultContractAddresses } from '../utils/contract_addresses';

/**
 * This class includes the functionality related to interacting with the OrderValidator contract.
 */
export class OrderValidatorWrapper {
    public abi: ContractAbi = OrderValidator.compilerOutput.abi;
    public address: string;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _orderValidatorContract: OrderValidatorContract;
    /**
     * Instantiate OrderValidatorWrapper
     * @param web3Wrapper Web3Wrapper instance to use.
     * @param networkId Desired networkId.
     * @param address The address of the OrderValidator contract. If undefined,
     * will default to the known address corresponding to the networkId.
     */
    constructor(web3Wrapper: Web3Wrapper, networkId: number, address?: string) {
        this._web3Wrapper = web3Wrapper;
        this.address = address === undefined ? _getDefaultContractAddresses(networkId).orderValidator : address;
        this._orderValidatorContract = new OrderValidatorContract(
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
    }
    /**
     * Get an object conforming to OrderAndTraderInfo containing on-chain information of the provided order and address
     * @param   order           An object conforming to SignedOrder
     * @param   takerAddress    An ethereum address
     * @return  OrderAndTraderInfo
     */
    public async getOrderAndTraderInfoAsync(order: SignedOrder, takerAddress: string): Promise<OrderAndTraderInfo> {
        assert.doesConformToSchema('order', order, schemas.signedOrderSchema);
        assert.isETHAddressHex('takerAddress', takerAddress);
        const orderAndTraderInfo = await this._orderValidatorContract.getOrderAndTraderInfo.callAsync(
            order,
            takerAddress,
        );
        const result = {
            orderInfo: orderAndTraderInfo[0],
            traderInfo: orderAndTraderInfo[1],
        };
        return result;
    }
    /**
     * Get an array of objects conforming to OrderAndTraderInfo containing on-chain information of the provided orders and addresses
     * @param   orders          An array of objects conforming to SignedOrder
     * @param   takerAddresses  An array of ethereum addresses
     * @return  array of OrderAndTraderInfo
     */
    public async getOrdersAndTradersInfoAsync(
        orders: SignedOrder[],
        takerAddresses: string[],
    ): Promise<OrderAndTraderInfo[]> {
        assert.doesConformToSchema('orders', orders, schemas.signedOrdersSchema);
        _.forEach(takerAddresses, (takerAddress, index) =>
            assert.isETHAddressHex(`takerAddresses[${index}]`, takerAddress),
        );
        assert.assert(orders.length === takerAddresses.length, 'Expected orders.length to equal takerAddresses.length');
        const ordersAndTradersInfo = await this._orderValidatorContract.getOrdersAndTradersInfo.callAsync(
            orders,
            takerAddresses,
        );
        const orderInfos = ordersAndTradersInfo[0];
        const traderInfos = ordersAndTradersInfo[1];
        const result = _.map(orderInfos, (orderInfo, index) => {
            const traderInfo = traderInfos[index];
            return {
                orderInfo,
                traderInfo,
            };
        });
        return result;
    }
    /**
     * Get an object conforming to TraderInfo containing on-chain balance and allowances for maker and taker of order
     * @param   order           An object conforming to SignedOrder
     * @param   takerAddress    An ethereum address
     * @return  TraderInfo
     */
    public async getTraderInfoAsync(order: SignedOrder, takerAddress: string): Promise<TraderInfo> {
        assert.doesConformToSchema('order', order, schemas.signedOrderSchema);
        assert.isETHAddressHex('takerAddress', takerAddress);
        const result = await this._orderValidatorContract.getTraderInfo.callAsync(order, takerAddress);
        return result;
    }
    /**
     * Get an array of objects conforming to TraderInfo containing on-chain balance and allowances for maker and taker of order
     * @param   orders          An array of objects conforming to SignedOrder
     * @param   takerAddresses  An array of ethereum addresses
     * @return  array of TraderInfo
     */
    public async getTradersInfoAsync(orders: SignedOrder[], takerAddresses: string[]): Promise<TraderInfo[]> {
        assert.doesConformToSchema('orders', orders, schemas.signedOrdersSchema);
        _.forEach(takerAddresses, (takerAddress, index) =>
            assert.isETHAddressHex(`takerAddresses[${index}]`, takerAddress),
        );
        assert.assert(orders.length === takerAddresses.length, 'Expected orders.length to equal takerAddresses.length');
        const result = await this._orderValidatorContract.getTradersInfo.callAsync(orders, takerAddresses);
        return result;
    }
    /**
     * Get an object conforming to BalanceAndAllowance containing on-chain balance and allowance for some address and assetData
     * @param   address     An ethereum address
     * @param   assetData   An encoded string that can be decoded by a specified proxy contract
     * @return  BalanceAndAllowance
     */
    public async getBalanceAndAllowanceAsync(address: string, assetData: string): Promise<BalanceAndAllowance> {
        assert.isETHAddressHex('address', address);
        assert.isHexString('assetData', assetData);
        const balanceAndAllowance = await this._orderValidatorContract.getBalanceAndAllowance.callAsync(
            address,
            assetData,
        );
        const result = {
            balance: balanceAndAllowance[0],
            allowance: balanceAndAllowance[1],
        };
        return result;
    }
    /**
     * Get an array of objects conforming to BalanceAndAllowance containing on-chain balance and allowance for some address and array of assetDatas
     * @param   address     An ethereum address
     * @param   assetDatas  An array of encoded strings that can be decoded by a specified proxy contract
     * @return  BalanceAndAllowance
     */
    public async getBalancesAndAllowancesAsync(address: string, assetDatas: string[]): Promise<BalanceAndAllowance[]> {
        assert.isETHAddressHex('address', address);
        _.forEach(assetDatas, (assetData, index) => assert.isHexString(`assetDatas[${index}]`, assetData));
        const balancesAndAllowances = await this._orderValidatorContract.getBalancesAndAllowances.callAsync(
            address,
            assetDatas,
        );
        const balances = balancesAndAllowances[0];
        const allowances = balancesAndAllowances[1];
        const result = _.map(balances, (balance, index) => {
            const allowance = allowances[index];
            return {
                balance,
                allowance,
            };
        });
        return result;
    }
    /**
     * Get owner address of tokenId by calling `token.ownerOf(tokenId)`, but returns a null owner instead of reverting on an unowned token.
     * @param   tokenAddress    An ethereum address
     * @param   tokenId         An ERC721 tokenId
     * @return  Owner of tokenId or null address if unowned
     */
    public async getERC721TokenOwnerAsync(tokenAddress: string, tokenId: BigNumber): Promise<string | undefined> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isBigNumber('tokenId', tokenId);
        const result = await this._orderValidatorContract.getERC721TokenOwner.callAsync(tokenAddress, tokenId);
        return result;
    }
}
