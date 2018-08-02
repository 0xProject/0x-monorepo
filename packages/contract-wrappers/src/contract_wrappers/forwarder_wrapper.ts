import { schemas } from '@0xproject/json-schemas';
import { AssetProxyId, OrderRelevantState, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import { orderTxOptsSchema } from '../schemas/order_tx_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import { TransactionOpts } from '../types';
import { assert } from '../utils/assert';
import { calldataOptimizationUtils } from '../utils/calldata_optimization_utils';
import { constants } from '../utils/constants';

import { ContractWrapper } from './contract_wrapper';
import { ForwarderContract } from './generated/forwarder';

/**
 * This class includes the functionality related to interacting with the Forwarder contract.
 */
export class ForwarderWrapper extends ContractWrapper {
    public abi: ContractAbi = artifacts.Forwarder.compilerOutput.abi;
    private _forwarderContractIfExists?: ForwarderContract;
    private _contractAddressIfExists?: string;
    private _zrxContractAddressIfExists?: string;
    /**
     * Takes an array of orders and returns a subset of those orders that has enough makerAssetAmount (taking into account on-chain balances,
     * allowances, and partial fills) in order to fill the input makerAssetFillAmount plus slippageBufferAmount. Iterates from first order to last.
     * Sort the input by ascending rate in order to get the subset of orders that will cost the least ETH.
     * @param   signedOrders         An array of objects that conform to the SignedOrder interface. All orders should specify the same makerAsset.
     *                               All orders should specify WETH as the takerAsset.
     * @param   orderStates          An array of objects corresponding to the signedOrders parameter that each contain on-chain state
     *                               relevant to that order.
     * @param   makerAssetFillAmount The amount of makerAsset desired to be filled.
     * @param   slippageBufferAmount An additional amount makerAsset to be covered by the result in case of trade collisions or partial fills.
     * @return  Resulting orders and remaining fill amount that could not be covered by the input.
     */
    public static findOrdersThatCoverMakerAssetFillAmount(
        signedOrders: SignedOrder[],
        orderStates: OrderRelevantState[],
        makerAssetFillAmount: BigNumber,
        slippageBufferAmount: BigNumber = constants.ZERO_AMOUNT,
    ): { resultOrders: SignedOrder[]; remainingFillAmount: BigNumber } {
        // type assertions
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        assert.isBigNumber('slippageBufferAmount', slippageBufferAmount);
        // calculate total amount of makerAsset needed to be filled
        const totalFillAmount = makerAssetFillAmount.plus(slippageBufferAmount);
        // iterate through the signedOrders input from left to right until we have enough makerAsset to fill totalFillAmount
        const result = _.reduce(
            signedOrders,
            ({ resultOrders, remainingFillAmount }, order, index) => {
                if (remainingFillAmount.lessThanOrEqualTo(constants.ZERO_AMOUNT)) {
                    return { resultOrders, remainingFillAmount: constants.ZERO_AMOUNT };
                } else {
                    const orderState = orderStates[index];
                    const makerAssetAmountAvailable = ForwarderWrapper._getMakerAssetAmountAvailable(orderState);
                    return {
                        resultOrders: _.concat(resultOrders, order),
                        remainingFillAmount: remainingFillAmount.minus(makerAssetAmountAvailable),
                    };
                }
            },
            { resultOrders: [] as SignedOrder[], remainingFillAmount: totalFillAmount },
        );
        return result;
    }
    /**
     * Takes an array of orders and an array of feeOrders. Returns a subset of the feeOrders that has enough ZRX (taking into account
     * on-chain balances, allowances, and partial fills) in order to fill the takerFees required by signedOrders plus a
     * slippageBufferAmount. Iterates from first feeOrder to last. Sort the feeOrders by ascending rate in order to get the subset of
     * feeOrders that will cost the least ETH.
     * @param   signedOrders         An array of objects that conform to the SignedOrder interface. All orders should specify ZRX as
     *                               the makerAsset and WETH as the takerAsset.
     * @param   orderStates          An array of objects corresponding to the signedOrders parameter that each contain on-chain state
     *                               relevant to that order.
     * @param   signedFeeOrders      An array of objects that conform to the SignedOrder interface. All orders should specify ZRX as
     *                               the makerAsset and WETH as the takerAsset.
     * @param   feeOrderStates       An array of objects corresponding to the signedOrders parameter that each contain on-chain state
     *                               relevant to that order.
     * @param   makerAssetFillAmount The amount of makerAsset desired to be filled.
     * @param   slippageBufferAmount An additional amount makerAsset to be covered by the result in case of trade collisions or partial fills.
     * @return  Resulting orders and remaining fill amount that could not be covered by the input.
     */
    public static findFeeOrdersThatCoverFeesForTargetOrders(
        signedOrders: SignedOrder[],
        orderStates: OrderRelevantState[],
        signedFeeOrders: SignedOrder[],
        feeOrderStates: OrderRelevantState[],
        slippageBufferAmount: BigNumber = constants.ZERO_AMOUNT,
    ): { resultOrders: SignedOrder[]; remainingFillAmount: BigNumber } {
        // type assertions
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.doesConformToSchema('signedFeeOrders', signedFeeOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('slippageBufferAmount', slippageBufferAmount);
        // calculate total amount of ZRX needed to fill signedOrders
        const totalFeeAmount = _.reduce(
            signedOrders,
            (accFees, order, index) => {
                const orderState = orderStates[index];
                const makerAssetAmountAvailable = ForwarderWrapper._getMakerAssetAmountAvailable(orderState);
                const feeToFillMakerAssetAmountAvailable = makerAssetAmountAvailable
                    .div(order.makerAssetAmount)
                    .mul(order.takerFee);
                return feeToFillMakerAssetAmountAvailable;
            },
            constants.ZERO_AMOUNT,
        );
        return ForwarderWrapper.findOrdersThatCoverMakerAssetFillAmount(
            signedFeeOrders,
            feeOrderStates,
            totalFeeAmount,
            slippageBufferAmount,
        );
    }
    private static _getMakerAssetAmountAvailable(orderState: OrderRelevantState): BigNumber {
        return BigNumber.min(
            orderState.makerBalance,
            orderState.remainingFillableMakerAssetAmount,
            orderState.makerProxyAllowance,
        );
    }
    constructor(
        web3Wrapper: Web3Wrapper,
        networkId: number,
        contractAddressIfExists?: string,
        zrxContractAddressIfExists?: string,
    ) {
        super(web3Wrapper, networkId);
        this._contractAddressIfExists = contractAddressIfExists;
        this._zrxContractAddressIfExists = zrxContractAddressIfExists;
    }
    /**
     * Purchases as much of orders' makerAssets as possible by selling up to 95% of transaction's ETH value.
     * Any ZRX required to pay fees for primary orders will automatically be purchased by this contract.
     * 5% of ETH value is reserved for paying fees to order feeRecipients (in ZRX) and forwarding contract feeRecipient (in ETH).
     * Any ETH not spent will be refunded to sender.
     * @param   signedOrders         An array of objects that conform to the SignedOrder interface. All orders must specify the same makerAsset.
     *                               All orders must specify WETH as the takerAsset
     * @param   takerAddress         The user Ethereum address who would like to fill this order. Must be available via the supplied
     *                               Provider provided at instantiation.
     * @param   ethAmount            The amount of eth to send with the transaction (in wei).
     * @param   signedFeeOrders      An array of objects that conform to the SignedOrder interface. All orders must specify ZRX as makerAsset and WETH as takerAsset.
     *                               Used to purchase ZRX for primary order fees.
     * @param   feePercentage        The percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
     *                               Defaults to 0.
     * @param   feeRecipientAddress  The address that will receive ETH when signedFeeOrders are filled.
     * @param   txOpts               Transaction parameters.
     * @return  Transaction hash.
     */
    public async marketSellOrdersWithEthAsync(
        signedOrders: SignedOrder[],
        takerAddress: string,
        ethAmount: BigNumber,
        signedFeeOrders: SignedOrder[] = [],
        feePercentage: BigNumber = constants.ZERO_AMOUNT,
        feeRecipientAddress: string = constants.NULL_ADDRESS,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        // type assertions
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.isBigNumber('ethAmount', ethAmount);
        assert.doesConformToSchema('signedFeeOrders', signedFeeOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('feePercentage', feePercentage);
        assert.isETHAddressHex('feeRecipientAddress', feeRecipientAddress);
        assert.doesConformToSchema('txOpts', txOpts, txOptsSchema);
        // other assertions
        assert.ordersCanBeUsedForForwarderContract(signedOrders, this.getEtherTokenAddress());
        assert.feeOrdersCanBeUsedForForwarderContract(
            signedFeeOrders,
            this.getZRXTokenAddress(),
            this.getEtherTokenAddress(),
        );
        // lowercase input addresses
        const normalizedTakerAddress = takerAddress.toLowerCase();
        const normalizedFeeRecipientAddress = feeRecipientAddress.toLowerCase();
        // optimize orders
        const optimizedMarketOrders = calldataOptimizationUtils.optimizeForwarderOrders(signedOrders);
        const optimizedFeeOrders = calldataOptimizationUtils.optimizeForwarderFeeOrders(signedFeeOrders);
        // send transaction
        const forwarderContractInstance = await this._getForwarderContractAsync();
        const txHash = await forwarderContractInstance.marketSellOrdersWithEth.sendTransactionAsync(
            optimizedMarketOrders,
            _.map(optimizedMarketOrders, order => order.signature),
            optimizedFeeOrders,
            _.map(optimizedFeeOrders, order => order.signature),
            feePercentage,
            feeRecipientAddress,
            {
                value: ethAmount,
                from: normalizedTakerAddress,
                gas: txOpts.gasLimit,
                gasPrice: txOpts.gasPrice,
            },
        );
        return txHash;
    }
    /**
     * Attempt to purchase makerAssetFillAmount of makerAsset by selling ethAmount provided with transaction.
     * Any ZRX required to pay fees for primary orders will automatically be purchased by the contract.
     * Any ETH not spent will be refunded to sender.
     * @param   signedOrders         An array of objects that conform to the SignedOrder interface. All orders must specify the same makerAsset.
     *                               All orders must specify WETH as the takerAsset
     * @param   makerAssetFillAmount The amount of the order (in taker asset baseUnits) that you wish to fill.
     * @param   takerAddress         The user Ethereum address who would like to fill this order. Must be available via the supplied
     *                               Provider provided at instantiation.
     * @param   ethAmount            The amount of eth to send with the transaction (in wei).
     * @param   signedFeeOrders      An array of objects that conform to the SignedOrder interface. All orders must specify ZRX as makerAsset and WETH as takerAsset.
     *                               Used to purchase ZRX for primary order fees.
     * @param   feePercentage        The percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
     *                               Defaults to 0.
     * @param   feeRecipientAddress  The address that will receive ETH when signedFeeOrders are filled.
     * @param   txOpts               Transaction parameters.
     * @return  Transaction hash.
     */
    public async marketBuyOrdersWithEthAsync(
        signedOrders: SignedOrder[],
        makerAssetFillAmount: BigNumber,
        takerAddress: string,
        ethAmount: BigNumber,
        signedFeeOrders: SignedOrder[] = [],
        feePercentage: BigNumber = constants.ZERO_AMOUNT,
        feeRecipientAddress: string = constants.NULL_ADDRESS,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        // type assertions
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.isBigNumber('ethAmount', ethAmount);
        assert.doesConformToSchema('signedFeeOrders', signedFeeOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('feePercentage', feePercentage);
        assert.isETHAddressHex('feeRecipientAddress', feeRecipientAddress);
        assert.doesConformToSchema('txOpts', txOpts, txOptsSchema);
        // other assertions
        assert.ordersCanBeUsedForForwarderContract(signedOrders, this.getEtherTokenAddress());
        assert.feeOrdersCanBeUsedForForwarderContract(
            signedFeeOrders,
            this.getZRXTokenAddress(),
            this.getEtherTokenAddress(),
        );
        // lowercase input addresses
        const normalizedTakerAddress = takerAddress.toLowerCase();
        const normalizedFeeRecipientAddress = feeRecipientAddress.toLowerCase();
        // optimize orders
        const optimizedMarketOrders = calldataOptimizationUtils.optimizeForwarderOrders(signedOrders);
        const optimizedFeeOrders = calldataOptimizationUtils.optimizeForwarderFeeOrders(signedFeeOrders);
        // send transaction
        const forwarderContractInstance = await this._getForwarderContractAsync();
        const txHash = await forwarderContractInstance.marketBuyOrdersWithEth.sendTransactionAsync(
            optimizedMarketOrders,
            makerAssetFillAmount,
            _.map(optimizedMarketOrders, order => order.signature),
            optimizedFeeOrders,
            _.map(optimizedFeeOrders, order => order.signature),
            feePercentage,
            feeRecipientAddress,
            {
                value: ethAmount,
                from: normalizedTakerAddress,
                gas: txOpts.gasLimit,
                gasPrice: txOpts.gasPrice,
            },
        );
        return txHash;
    }
    /**
     * Retrieves the Ethereum address of the Forwarder contract deployed on the network
     * that the user-passed web3 provider is connected to.
     * @returns The Ethereum address of the Forwarder contract being used.
     */
    public getContractAddress(): string {
        const contractAddress = this._getContractAddress(artifacts.Forwarder, this._contractAddressIfExists);
        return contractAddress;
    }
    /**
     * Returns the ZRX token address used by the forwarder contract.
     * @return Address of ZRX token
     */
    public getZRXTokenAddress(): string {
        const contractAddress = this._getContractAddress(artifacts.ZRXToken, this._zrxContractAddressIfExists);
        return contractAddress;
    }
    /**
     * Returns the Ether token address used by the forwarder contract.
     * @return Address of Ether token
     */
    public getEtherTokenAddress(): string {
        const contractAddress = this._getContractAddress(artifacts.EtherToken);
        return contractAddress;
    }
    // HACK: We don't want this method to be visible to the other units within that package but not to the end user.
    // TS doesn't give that possibility and therefore we make it private and access it over an any cast. Because of that tslint sees it as unused.
    // tslint:disable-next-line:no-unused-variable
    private _invalidateContractInstance(): void {
        delete this._forwarderContractIfExists;
    }
    private async _getForwarderContractAsync(): Promise<ForwarderContract> {
        if (!_.isUndefined(this._forwarderContractIfExists)) {
            return this._forwarderContractIfExists;
        }
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.Forwarder,
            this._contractAddressIfExists,
        );
        const contractInstance = new ForwarderContract(
            abi,
            address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._forwarderContractIfExists = contractInstance;
        return this._forwarderContractIfExists;
    }
}
