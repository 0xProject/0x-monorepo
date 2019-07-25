import { ForwarderContract } from '@0x/abi-gen-wrappers';
import { Forwarder } from '@0x/contract-artifacts';
import { schemas } from '@0x/json-schemas';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { orderTxOptsSchema } from '../schemas/order_tx_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import { OrderTransactionOpts } from '../types';
import { assert } from '../utils/assert';
import { calldataOptimizationUtils } from '../utils/calldata_optimization_utils';
import { constants } from '../utils/constants';
import { _getDefaultContractAddresses } from '../utils/contract_addresses';
import { decorators } from '../utils/decorators';
import { utils } from '../utils/utils';

/**
 * This class includes the functionality related to interacting with the Forwarder contract.
 */
export class ForwarderWrapper {
    public abi: ContractAbi = Forwarder.compilerOutput.abi;
    public address: string;
    public zrxTokenAddress: string;
    public etherTokenAddress: string;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _forwarderContract: ForwarderContract;

    /**
     * Instantiate ForwarderWrapper
     * @param web3Wrapper Web3Wrapper instance to use.
     * @param networkId Desired networkId.
     * @param address The address of the Exchange contract. If undefined, will
     * default to the known address corresponding to the networkId.
     * @param zrxTokenAddress The address of the ZRXToken contract. If
     * undefined, will default to the known address corresponding to the
     * networkId.
     * @param etherTokenAddress The address of a WETH (Ether token) contract. If
     * undefined, will default to the known address corresponding to the
     * networkId.
     */
    constructor(
        web3Wrapper: Web3Wrapper,
        networkId: number,
        address?: string,
        zrxTokenAddress?: string,
        etherTokenAddress?: string,
    ) {
        this._web3Wrapper = web3Wrapper;
        this.address = address === undefined ? _getDefaultContractAddresses(networkId).exchange : address;
        this.zrxTokenAddress =
            zrxTokenAddress === undefined ? _getDefaultContractAddresses(networkId).zrxToken : zrxTokenAddress;
        this.etherTokenAddress =
            etherTokenAddress === undefined ? _getDefaultContractAddresses(networkId).etherToken : etherTokenAddress;
        this._forwarderContract = new ForwarderContract(
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
    }
    /**
     * Purchases as much of orders' makerAssets as possible by selling up to 95% of transaction's ETH value.
     * Any ZRX required to pay fees for primary orders will automatically be purchased by this contract.
     * 5% of ETH value is reserved for paying fees to order feeRecipients (in ZRX) and forwarding contract feeRecipient (in ETH).
     * Any ETH not spent will be refunded to sender.
     * @param   signedOrders            An array of objects that conform to the SignedOrder interface. All orders must specify the same makerAsset.
     *                                  All orders must specify WETH as the takerAsset
     * @param   takerAddress            The user Ethereum address who would like to fill this order. Must be available via the supplied
     *                                  Provider provided at instantiation.
     * @param   ethAmount               The amount of eth to send with the transaction (in wei).
     * @param   signedFeeOrders         An array of objects that conform to the SignedOrder interface. All orders must specify ZRX as makerAsset and WETH as takerAsset.
     *                                  Used to purchase ZRX for primary order fees.
     * @param   feePercentage           The percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
     *                                  Defaults to 0.
     * @param   feeRecipientAddress     The address that will receive ETH when signedFeeOrders are filled.
     * @param   orderTransactionOpts    Transaction parameters.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async marketSellOrdersWithEthAsync(
        signedOrders: SignedOrder[],
        takerAddress: string,
        ethAmount: BigNumber,
        signedFeeOrders: SignedOrder[] = [],
        feePercentage: number = 0,
        feeRecipientAddress: string = constants.NULL_ADDRESS,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        // type assertions
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.isBigNumber('ethAmount', ethAmount);
        assert.doesConformToSchema('signedFeeOrders', signedFeeOrders, schemas.signedOrdersSchema);
        assert.isNumber('feePercentage', feePercentage);
        assert.isETHAddressHex('feeRecipientAddress', feeRecipientAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        // other assertions
        assert.ordersCanBeUsedForForwarderContract(signedOrders, this.etherTokenAddress);
        assert.feeOrdersCanBeUsedForForwarderContract(signedFeeOrders, this.zrxTokenAddress, this.etherTokenAddress);
        // format feePercentage
        const formattedFeePercentage = utils.numberPercentageToEtherTokenAmountPercentage(feePercentage);
        // lowercase input addresses
        const normalizedTakerAddress = takerAddress.toLowerCase();
        const normalizedFeeRecipientAddress = feeRecipientAddress.toLowerCase();
        // optimize orders
        const optimizedMarketOrders = calldataOptimizationUtils.optimizeForwarderOrders(signedOrders);
        const optimizedFeeOrders = calldataOptimizationUtils.optimizeForwarderFeeOrders(signedFeeOrders);
        // compile signatures
        const signatures = _.map(optimizedMarketOrders, order => order.signature);
        const feeSignatures = _.map(optimizedFeeOrders, order => order.signature);
        // validate transaction
        if (orderTransactionOpts.shouldValidate) {
            await this._forwarderContract.marketSellOrdersWithEth.callAsync(
                optimizedMarketOrders,
                signatures,
                optimizedFeeOrders,
                feeSignatures,
                formattedFeePercentage,
                normalizedFeeRecipientAddress,
                {
                    value: ethAmount,
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                    nonce: orderTransactionOpts.nonce,
                },
            );
        }
        // send transaction
        const txHash = await this._forwarderContract.marketSellOrdersWithEth.sendTransactionAsync(
            optimizedMarketOrders,
            signatures,
            optimizedFeeOrders,
            feeSignatures,
            formattedFeePercentage,
            feeRecipientAddress,
            {
                value: ethAmount,
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
        return txHash;
    }
    /**
     * Attempt to purchase makerAssetFillAmount of makerAsset by selling ethAmount provided with transaction.
     * Any ZRX required to pay fees for primary orders will automatically be purchased by the contract.
     * Any ETH not spent will be refunded to sender.
     * @param   signedOrders            An array of objects that conform to the SignedOrder interface. All orders must specify the same makerAsset.
     *                                  All orders must specify WETH as the takerAsset
     * @param   makerAssetFillAmount    The amount of the order (in taker asset baseUnits) that you wish to fill.
     * @param   takerAddress            The user Ethereum address who would like to fill this order. Must be available via the supplied
     *                                  Provider provided at instantiation.
     * @param   ethAmount               The amount of eth to send with the transaction (in wei).
     * @param   signedFeeOrders         An array of objects that conform to the SignedOrder interface. All orders must specify ZRX as makerAsset and WETH as takerAsset.
     *                                  Used to purchase ZRX for primary order fees.
     * @param   feePercentage           The percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
     *                                  Defaults to 0.
     * @param   feeRecipientAddress     The address that will receive ETH when signedFeeOrders are filled.
     * @param   orderTransactionOpts    Transaction parameters.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async marketBuyOrdersWithEthAsync(
        signedOrders: SignedOrder[],
        makerAssetFillAmount: BigNumber,
        takerAddress: string,
        ethAmount: BigNumber,
        signedFeeOrders: SignedOrder[] = [],
        feePercentage: number = 0,
        feeRecipientAddress: string = constants.NULL_ADDRESS,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        // type assertions
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.isBigNumber('ethAmount', ethAmount);
        assert.doesConformToSchema('signedFeeOrders', signedFeeOrders, schemas.signedOrdersSchema);
        assert.isNumber('feePercentage', feePercentage);
        assert.isETHAddressHex('feeRecipientAddress', feeRecipientAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        // other assertions
        assert.ordersCanBeUsedForForwarderContract(signedOrders, this.etherTokenAddress);
        assert.feeOrdersCanBeUsedForForwarderContract(signedFeeOrders, this.zrxTokenAddress, this.etherTokenAddress);
        // format feePercentage
        const formattedFeePercentage = utils.numberPercentageToEtherTokenAmountPercentage(feePercentage);
        // lowercase input addresses
        const normalizedTakerAddress = takerAddress.toLowerCase();
        const normalizedFeeRecipientAddress = feeRecipientAddress.toLowerCase();
        // optimize orders
        const optimizedMarketOrders = calldataOptimizationUtils.optimizeForwarderOrders(signedOrders);
        const optimizedFeeOrders = calldataOptimizationUtils.optimizeForwarderFeeOrders(signedFeeOrders);
        // compile signatures
        const signatures = _.map(optimizedMarketOrders, order => order.signature);
        const feeSignatures = _.map(optimizedFeeOrders, order => order.signature);
        // validate transaction
        if (orderTransactionOpts.shouldValidate) {
            await this._forwarderContract.marketBuyOrdersWithEth.callAsync(
                optimizedMarketOrders,
                makerAssetFillAmount,
                signatures,
                optimizedFeeOrders,
                feeSignatures,
                formattedFeePercentage,
                normalizedFeeRecipientAddress,
                {
                    value: ethAmount,
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                    nonce: orderTransactionOpts.nonce,
                },
            );
        }
        // send transaction
        const txHash = await this._forwarderContract.marketBuyOrdersWithEth.sendTransactionAsync(
            optimizedMarketOrders,
            makerAssetFillAmount,
            signatures,
            optimizedFeeOrders,
            feeSignatures,
            formattedFeePercentage,
            feeRecipientAddress,
            {
                value: ethAmount,
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
        return txHash;
    }
}
