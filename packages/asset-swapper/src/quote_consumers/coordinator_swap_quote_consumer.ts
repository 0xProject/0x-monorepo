import { ContractError, ContractWrappers, CoordinatorContract } from '@0x/contract-wrappers';
import { generatePseudoRandomSalt, signatureUtils } from '@0x/order-utils';
import { MarketOperation, SignatureType, SignedZeroExTransaction, ZeroExTransaction } from '@0x/types';
import { NULL_BYTES, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { MethodAbi, SupportedProvider, ZeroExProvider } from 'ethereum-types';
import _ = require('lodash');

import { constants } from '../constants';
import {
    CalldataInfo,
    CoordinatorSmartContractParams,
    CoordinatorSwapQuoteGetOutputOptsBase,
    SmartContractParamsInfo,
    SwapQuote,
    SwapQuoteConsumerError,
    SwapQuoteConsumerOpts,
    SwapQuoteExecutionOptsBase,
} from '../types';
import { assert } from '../utils/assert';
import { swapQuoteConsumerUtils } from '../utils/swap_quote_consumer_utils';
import { utils } from '../utils/utils';

export class CoordinatorSwapQuoteConsumer {
    public readonly provider: ZeroExProvider;
    public readonly networkId: number;

    private readonly _contractWrappers: ContractWrappers;
    private readonly _web3Wrapper: Web3Wrapper;

    constructor(supportedProvider: SupportedProvider, options: Partial<SwapQuoteConsumerOpts> = {}) {
        const { networkId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('networkId', networkId);

        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this.provider = provider;
        this.networkId = networkId;
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });
        this._web3Wrapper = new Web3Wrapper(supportedProvider);
    }
    public async getCalldataOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<CoordinatorSwapQuoteGetOutputOptsBase>,
    ): Promise<CalldataInfo> {
        const { ethAmount, methodAbi, params } = await this.getSmartContractParamsOrThrowAsync(quote, opts);
        const { signedZeroExTransaction, txOrigin, coordinatorExpirationTimes, coordinatorSignatures } = params;

        const coordinator = new CoordinatorContract(this._contractWrappers.coordinator.address, this.provider);

        const calldataHexString = coordinator.executeTransaction.getABIEncodedTransactionData(
            signedZeroExTransaction,
            txOrigin,
            signedZeroExTransaction.signature,
            coordinatorExpirationTimes,
            coordinatorSignatures,
        );
        return {
            calldataHexString,
            methodAbi,
            toAddress: coordinator.address,
            ethAmount,
        };
    }
    public async getSmartContractParamsOrThrowAsync(
        quote: SwapQuote,
        _opts: Partial<CoordinatorSwapQuoteGetOutputOptsBase>,
    ): Promise<SmartContractParamsInfo<CoordinatorSmartContractParams>> {
        assert.isValidSwapQuote('quote', quote);
        const signedZeroExTransaction = await this._getSignedZeroExTransactionAsync(quote, _opts);
        const txOriginOrSigner = _opts.txOrigin || signedZeroExTransaction.signerAddress;

        const {
            coordinatorSignatures,
            coordinatorExpirationTimes,
        } = await this._contractWrappers.coordinator.getCoordinatorApprovalsAsync(
            [...quote.orders, ...quote.feeOrders],
            signedZeroExTransaction,
            txOriginOrSigner,
        );

        const params: CoordinatorSmartContractParams = {
            signedZeroExTransaction,
            txOrigin: txOriginOrSigner,
            coordinatorSignatures,
            coordinatorExpirationTimes,
        };

        const methodAbi = utils.getMethodAbiFromContractAbi(
            this._contractWrappers.coordinator.abi,
            'executeTransaction',
        ) as MethodAbi;

        return {
            params,
            toAddress: this._contractWrappers.coordinator.address,
            methodAbi,
        };
    }

    public async executeSwapQuoteOrThrowAsync(
        quote: SwapQuote,
        opts: Partial<SwapQuoteExecutionOptsBase>,
    ): Promise<string> {
        assert.isValidSwapQuote('quote', quote);

        const { gasLimit, gasPrice } = opts;

        if (gasLimit !== undefined) {
            assert.isNumber('gasLimit', gasLimit);
        }
        if (gasPrice !== undefined) {
            assert.isBigNumber('gasPrice', gasPrice);
        }

        const { params } = await this.getSmartContractParamsOrThrowAsync(quote, opts);
        const { signedZeroExTransaction, txOrigin, coordinatorExpirationTimes, coordinatorSignatures } = params;
        try {
            // Create a Coordinator Contract directly to use executeTransaction
            const coordinator = new CoordinatorContract(
                this._contractWrappers.coordinator.address,
                this._contractWrappers.getProvider(),
            );
            const txHash = await coordinator.executeTransaction.validateAndSendTransactionAsync(
                signedZeroExTransaction,
                signedZeroExTransaction.signerAddress,
                signedZeroExTransaction.signature,
                coordinatorExpirationTimes,
                coordinatorSignatures,
                { from: txOrigin, gas: gasLimit, gasPrice },
            );
            return txHash;
        } catch (err) {
            if (_.includes(err.message, ContractError.SignatureRequestDenied)) {
                throw new Error(SwapQuoteConsumerError.SignatureRequestDenied);
            } else {
                throw err;
            }
        }
    }

    private async _getSignedZeroExTransactionAsync(
        quote: SwapQuote,
        opts: Partial<CoordinatorSwapQuoteGetOutputOptsBase>,
    ): Promise<SignedZeroExTransaction> {
        assert.isValidSwapQuote('quote', quote);
        if (opts.txOrigin) {
            assert.isETHAddressHex('opts.txOrigin', opts.txOrigin);
        }
        if (opts.takerAddress) {
            assert.isETHAddressHex('opts.takerAddress', opts.takerAddress);
        }

        const { orders } = quote;
        const signatures = _.map(orders, o => o.signature);

        let zeroExOperation: string;
        if (quote.type === MarketOperation.Buy) {
            const { makerAssetFillAmount } = quote;
            zeroExOperation = this._contractWrappers.exchange.marketBuyOrdersNoThrow.getABIEncodedTransactionData(
                orders,
                makerAssetFillAmount,
                signatures,
            );
        } else {
            const { takerAssetFillAmount } = quote;
            zeroExOperation = this._contractWrappers.exchange.marketSellOrdersNoThrow.getABIEncodedTransactionData(
                orders,
                takerAssetFillAmount,
                signatures,
            );
        }

        const takerAddress = await swapQuoteConsumerUtils.getTakerAddressOrThrowAsync(this.provider, opts);
        const transaction: ZeroExTransaction = {
            salt: generatePseudoRandomSalt(),
            signerAddress: takerAddress,
            data: zeroExOperation,
            verifyingContractAddress: this._contractWrappers.exchange.address,
        };
        // If the takerAddress is a contract we need to generate an `isValidSignature` SignatureType and skip
        // the signing via the provider.
        const contractCode = await this._web3Wrapper.getContractCodeAsync(takerAddress);
        if (contractCode === NULL_BYTES) {
            // Sign as an EOA user
            const signedZeroExTransaction = await signatureUtils.ecSignTransactionAsync(
                this.provider,
                transaction,
                takerAddress,
            );
            return signedZeroExTransaction;
        } else {
            /*
                function isValidSignature(
                        bytes32, // hash
                        bytes calldata // signature
                )
                    external
                    pure
                    returns (bytes4)
                {
                    return IS_VALID_WALLET_SIGNATURE_MAGIC_VALUE;
                }
             */
            const signature = signatureUtils.convertToSignatureWithType(NULL_BYTES, SignatureType.Wallet);
            return {
                ...transaction,
                signature,
            };
        }
    }
}
