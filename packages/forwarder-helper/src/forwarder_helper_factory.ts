import { assert } from '@0xproject/assert';
import { APIOrder, HttpClient, OrderbookResponse } from '@0xproject/connect';
import { ContractWrappers, OrderAndTraderInfo, OrderStatus } from '@0xproject/contract-wrappers';
import { schemas } from '@0xproject/json-schemas';
import { assetDataUtils } from '@0xproject/order-utils';
import { RemainingFillableCalculator } from '@0xproject/order-utils/lib/src/remaining_fillable_calculator';
import { RPCSubprovider, Web3ProviderEngine } from '@0xproject/subproviders';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { constants } from './constants';
import { ForwarderHelperImpl, ForwarderHelperImplConfig } from './forwarder_helper_impl';
import { ForwarderHelper, ForwarderHelperFactoryError } from './types';
import { orderUtils } from './utils/order_utils';

export const forwarderHelperFactory = {
    /**
     * Given an array of orders and an array of feeOrders, get a ForwarderHelper
     * @param   orders      An array of objects conforming to SignedOrder. Each order should specify the same makerAssetData and takerAssetData
     * @param   feeOrders   An array of objects conforming to SignedOrder. Each order should specify ZRX as makerAssetData WETH as takerAssetData
     * @return  A ForwarderHelper, see type for definition
     */
    getForwarderHelperForOrders(orders: SignedOrder[], feeOrders: SignedOrder[] = []): ForwarderHelper {
        assert.doesConformToSchema('orders', orders, schemas.signedOrdersSchema);
        assert.doesConformToSchema('feeOrders', orders, schemas.signedOrdersSchema);
        const config: ForwarderHelperImplConfig = {
            orders,
            feeOrders,
        };
        const helper = new ForwarderHelperImpl(config);
        return helper;
    },
    /**
     * Given a desired makerAsset and SRA url, get a ForwarderHelper
     * @param   makerAssetData      An array of objects conforming to SignedOrder. Each order should specify the same makerAssetData and takerAssetData
     * @param   sraUrl              A url pointing to an SRA v2 compliant endpoint.
     * @param   rpcUrl              A url pointing to an ethereum node.
     * @param   networkId           The ethereum networkId, defaults to 1 (mainnet).
     * @return  A ForwarderHelper, see type for definition
     */
    async getForwarderHelperForMakerAssetDataAsync(
        makerAssetData: string,
        sraUrl: string,
        rpcUrl?: string,
        networkId: number = 1,
    ): Promise<ForwarderHelper> {
        assert.isHexString('makerAssetData', makerAssetData);
        assert.isWebUri('sraUrl', sraUrl);
        if (!_.isUndefined(rpcUrl)) {
            assert.isWebUri('rpcUrl', rpcUrl);
        }
        assert.isNumber('networkId', networkId);
        // create provider
        const providerEngine = new Web3ProviderEngine();
        if (!_.isUndefined(rpcUrl)) {
            providerEngine.addProvider(new RPCSubprovider(rpcUrl));
        }
        providerEngine.start();
        // create contract wrappers given provider and networkId
        const contractWrappers = new ContractWrappers(providerEngine, { networkId });
        // find ether token asset data
        const etherTokenAddressIfExists = contractWrappers.etherToken.getContractAddressIfExists();
        if (_.isUndefined(etherTokenAddressIfExists)) {
            throw new Error(ForwarderHelperFactoryError.NoEtherTokenContractFound);
        }
        const etherTokenAssetData = assetDataUtils.encodeERC20AssetData(etherTokenAddressIfExists);
        // find zrx token asset data
        let zrxTokenAssetData: string;
        try {
            zrxTokenAssetData = contractWrappers.exchange.getZRXAssetData();
        } catch (err) {
            throw new Error(ForwarderHelperFactoryError.NoZrxTokenContractFound);
        }
        // get orderbooks for makerAsset/WETH and ZRX/WETH
        const sraClient = new HttpClient(sraUrl);
        const orderbookRequests = [
            { baseAssetData: makerAssetData, quoteAssetData: etherTokenAssetData },
            { baseAssetData: zrxTokenAssetData, quoteAssetData: etherTokenAssetData },
        ];
        const requestOpts = { networkId };
        // TODO: try catch these requests and throw a more domain specific error
        const [makerAssetOrderbook, zrxOrderbook] = await Promise.all(
            _.map(orderbookRequests, request => sraClient.getOrderbookAsync(request, requestOpts)),
        );
        // validate orders and find remaining fillable from on chain state or sra api
        let ordersAndRemainingFillableMakerAssetAmounts: OrdersAndRemainingFillableMakerAssetAmounts;
        let feeOrdersAndRemainingFillableMakerAssetAmounts: OrdersAndRemainingFillableMakerAssetAmounts;
        if (!_.isUndefined(rpcUrl)) {
            // if we do have an rpc url, get on-chain orders and traders info via the OrderValidatorWrapper
            const ordersFromSra = getOpenAsksFromOrderbook(makerAssetOrderbook);
            const feeOrdersFromSra = getOpenAsksFromOrderbook(zrxOrderbook);
            // TODO: try catch these requests and throw a more domain specific error
            const [makerAssetOrdersAndTradersInfo, feeOrdersAndTradersInfo] = await Promise.all(
                _.map([ordersFromSra, feeOrdersFromSra], ordersToBeValidated => {
                    const takerAddresses = _.map(ordersToBeValidated, () => constants.NULL_ADDRESS);
                    return contractWrappers.orderValidator.getOrdersAndTradersInfoAsync(
                        ordersToBeValidated,
                        takerAddresses,
                    );
                }),
            );
            // take maker asset orders from SRA + on chain information and find the valid orders and remaining fillable maker asset amounts
            ordersAndRemainingFillableMakerAssetAmounts = getValidOrdersAndRemainingFillableMakerAssetAmountsFromOnChain(
                ordersFromSra,
                makerAssetOrdersAndTradersInfo,
                zrxTokenAssetData,
            );
            // take fee orders from SRA + on chain information and find the valid orders and remaining fillable maker asset amounts
            feeOrdersAndRemainingFillableMakerAssetAmounts = getValidOrdersAndRemainingFillableMakerAssetAmountsFromOnChain(
                feeOrdersFromSra,
                feeOrdersAndTradersInfo,
                zrxTokenAssetData,
            );
        } else {
            // if we don't have an rpc url, assume all orders are valid and fallback to optional fill amounts from SRA
            // if fill amounts are not available from the SRA, assume all orders are completely fillable
            const apiOrdersFromSra = makerAssetOrderbook.asks.records;
            const feeApiOrdersFromSra = zrxOrderbook.asks.records;
            // take maker asset orders from SRA and the valid orders and remaining fillable maker asset amounts
            ordersAndRemainingFillableMakerAssetAmounts = getValidOrdersAndRemainingFillableMakerAssetAmountsFromApi(
                apiOrdersFromSra,
            );
            // take fee orders from SRA and find the valid orders and remaining fillable maker asset amounts
            feeOrdersAndRemainingFillableMakerAssetAmounts = getValidOrdersAndRemainingFillableMakerAssetAmountsFromApi(
                feeApiOrdersFromSra,
            );
        }
        // compile final config
        const config: ForwarderHelperImplConfig = {
            orders: ordersAndRemainingFillableMakerAssetAmounts.orders,
            feeOrders: feeOrdersAndRemainingFillableMakerAssetAmounts.orders,
            remainingFillableMakerAssetAmounts:
                ordersAndRemainingFillableMakerAssetAmounts.remainingFillableMakerAssetAmounts,
            remainingFillableFeeAmounts:
                feeOrdersAndRemainingFillableMakerAssetAmounts.remainingFillableMakerAssetAmounts,
        };
        const helper = new ForwarderHelperImpl(config);
        return helper;
    },
};

interface OrdersAndRemainingFillableMakerAssetAmounts {
    orders: SignedOrder[];
    remainingFillableMakerAssetAmounts: BigNumber[];
}

/**
 * Given an array of APIOrder objects from a standard relayer api, return an array
 * of fillable orders with their corresponding remainingFillableMakerAssetAmounts
 */
function getValidOrdersAndRemainingFillableMakerAssetAmountsFromApi(
    apiOrders: APIOrder[],
): OrdersAndRemainingFillableMakerAssetAmounts {
    const result = _.reduce(
        apiOrders,
        (acc, apiOrder, index) => {
            // get current accumulations
            const { orders, remainingFillableMakerAssetAmounts } = acc;
            // get order and metadata
            const { order, metaData } = apiOrder;
            // if the order is expired or not open, move on
            if (orderUtils.isOrderExpired(order) || !orderUtils.isOpenOrder(order)) {
                return acc;
            }
            // calculate remainingFillableMakerAssetAmount from api metadata
            const remainingFillableTakerAssetAmount = _.get(
                metaData,
                'remainingTakerAssetAmount',
                order.takerAssetAmount,
            );
            const remainingFillableMakerAssetAmount = orderUtils.calculateRemainingMakerAssetAmount(
                order,
                remainingFillableTakerAssetAmount,
            );
            // if there is some amount of maker asset left to fill and add the order and remaining amount to the accumulations
            // if there is not any maker asset left to fill, do not add
            if (remainingFillableMakerAssetAmount.gt(constants.ZERO_AMOUNT)) {
                return {
                    orders: _.concat(orders, order),
                    remainingFillableMakerAssetAmounts: _.concat(
                        remainingFillableMakerAssetAmounts,
                        remainingFillableMakerAssetAmount,
                    ),
                };
            } else {
                return acc;
            }
        },
        { orders: [] as SignedOrder[], remainingFillableMakerAssetAmounts: [] as BigNumber[] },
    );
    return result;
}

/**
 * Given an array of orders and corresponding on-chain infos, return a subset of the orders
 * that are still fillable orders with their corresponding remainingFillableMakerAssetAmounts
 */
function getValidOrdersAndRemainingFillableMakerAssetAmountsFromOnChain(
    inputOrders: SignedOrder[],
    ordersAndTradersInfo: OrderAndTraderInfo[],
    zrxAssetData: string,
): OrdersAndRemainingFillableMakerAssetAmounts {
    // iterate through the input orders and find the ones that are still fillable
    // for the orders that are still fillable, calculate the remaining fillable maker asset amount
    const result = _.reduce(
        inputOrders,
        (acc, order, index) => {
            // get current accumulations
            const { orders, remainingFillableMakerAssetAmounts } = acc;
            // get corresponding on-chain state for the order
            const { orderInfo, traderInfo } = ordersAndTradersInfo[index];
            // if the order IS NOT fillable, do not add anything and continue iterating
            if (orderInfo.orderStatus !== OrderStatus.FILLABLE) {
                return acc;
            }
            // if the order IS fillable, add the order and calculate the remaining fillable amount
            const transferrableAssetAmount = BigNumber.min([traderInfo.makerAllowance, traderInfo.makerBalance]);
            const transferrableFeeAssetAmount = BigNumber.min([
                traderInfo.makerZrxAllowance,
                traderInfo.makerZrxBalance,
            ]);
            const remainingTakerAssetAmount = order.takerAssetAmount.minus(orderInfo.orderTakerAssetFilledAmount);
            const remainingMakerAssetAmount = orderUtils.calculateRemainingMakerAssetAmount(
                order,
                remainingTakerAssetAmount,
            );
            const remainingFillableCalculator = new RemainingFillableCalculator(
                order.makerFee,
                order.makerAssetAmount,
                order.makerAssetData === zrxAssetData,
                transferrableAssetAmount,
                transferrableFeeAssetAmount,
                remainingMakerAssetAmount,
            );
            const remainingFillableAmount = remainingFillableCalculator.computeRemainingFillable();
            return {
                orders: _.concat(orders, order),
                remainingFillableMakerAssetAmounts: _.concat(
                    remainingFillableMakerAssetAmounts,
                    remainingFillableAmount,
                ),
            };
        },
        { orders: [] as SignedOrder[], remainingFillableMakerAssetAmounts: [] as BigNumber[] },
    );
    return result;
}

function getOpenAsksFromOrderbook(orderbookResponse: OrderbookResponse): SignedOrder[] {
    const asks = _.map(orderbookResponse.asks.records, apiOrder => apiOrder.order);
    const result = _.filter(asks, ask => orderUtils.isOpenOrder(ask));
    return result;
}
