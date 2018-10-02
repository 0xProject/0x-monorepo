import { artifacts, wrappers } from '@0xproject/contracts';
import { schemas } from '@0xproject/json-schemas';
import { AssetProxyId, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { orderTxOptsSchema } from '../schemas/order_tx_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import { OrderTransactionOpts } from '../types';
import { assert } from '../utils/assert';
import { calldataOptimizationUtils } from '../utils/calldata_optimization_utils';
import { constants } from '../utils/constants';
import { decorators } from '../utils/decorators';
import { utils } from '../utils/utils';

import { ContractWrapper } from './contract_wrapper';

/**
 * This class includes the functionality related to interacting with the Forwarder contract.
 */
export class ForwarderWrapper extends ContractWrapper {
    public abi: ContractAbi = artifacts.Forwarder.compilerOutput.abi;
    private _forwarderContractIfExists?: wrappers.ForwarderContract;
    private _contractAddressIfExists?: string;
    private _zrxContractAddressIfExists?: string;
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
        assert.ordersCanBeUsedForForwarderContract(signedOrders, this.getEtherTokenAddress());
        assert.feeOrdersCanBeUsedForForwarderContract(
            signedFeeOrders,
            this.getZRXTokenAddress(),
            this.getEtherTokenAddress(),
        );
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
        // get contract
        const forwarderContractInstance = await this._getForwarderContractAsync();
        // validate transaction
        if (orderTransactionOpts.shouldValidate) {
            await forwarderContractInstance.marketSellOrdersWithEth.callAsync(
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
                },
            );
        }
        // send transaction
        const txHash = await forwarderContractInstance.marketSellOrdersWithEth.sendTransactionAsync(
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
        assert.ordersCanBeUsedForForwarderContract(signedOrders, this.getEtherTokenAddress());
        assert.feeOrdersCanBeUsedForForwarderContract(
            signedFeeOrders,
            this.getZRXTokenAddress(),
            this.getEtherTokenAddress(),
        );
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
        // get contract
        const forwarderContractInstance = await this._getForwarderContractAsync();
        // validate transaction
        if (orderTransactionOpts.shouldValidate) {
            await forwarderContractInstance.marketBuyOrdersWithEth.callAsync(
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
                },
            );
        }
        // send transaction
        const txHash = await forwarderContractInstance.marketBuyOrdersWithEth.sendTransactionAsync(
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
        const contractAddress = this._getContractAddress(artifacts.WETH9);
        return contractAddress;
    }
    // HACK: We don't want this method to be visible to the other units within that package but not to the end user.
    // TS doesn't give that possibility and therefore we make it private and access it over an any cast. Because of that tslint sees it as unused.
    // tslint:disable-next-line:no-unused-variable
    private _invalidateContractInstance(): void {
        delete this._forwarderContractIfExists;
    }
    private async _getForwarderContractAsync(): Promise<wrappers.ForwarderContract> {
        if (!_.isUndefined(this._forwarderContractIfExists)) {
            return this._forwarderContractIfExists;
        }
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.Forwarder,
            this._contractAddressIfExists,
        );
        const contractInstance = new wrappers.ForwarderContract(
            abi,
            address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._forwarderContractIfExists = contractInstance;
        return this._forwarderContractIfExists;
    }
}
