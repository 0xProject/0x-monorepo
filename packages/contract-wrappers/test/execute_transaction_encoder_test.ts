import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { FillScenarios } from '@0xproject/fill-scenarios';
import { assetDataUtils, ecSignOrderHashAsync, generatePseudoRandomSalt } from '@0xproject/order-utils';
import { SignedOrder, SignerType } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'mocha';

import { ContractWrappers } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ExecuteTransactionEncoder', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
    let zrxTokenAddress: string;
    let fillScenarios: FillScenarios;
    let exchangeContractAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let coinbase: string;
    let makerAddress: string;
    let senderAddress: string;
    let takerAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let feeRecipient: string;
    let txHash: string;
    const fillableAmount = new BigNumber(5);
    const takerTokenFillAmount = new BigNumber(5);
    let signedOrder: SignedOrder;
    let anotherSignedOrder: SignedOrder;
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
        blockPollingIntervalMs: 0,
    };
    before(async () => {
        await blockchainLifecycle.startAsync();
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.getContractAddress();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        zrxTokenAddress = tokenUtils.getProtocolTokenAddress();
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            zrxTokenAddress,
            exchangeContractAddress,
            contractWrappers.erc20Proxy.getContractAddress(),
            contractWrappers.erc721Proxy.getContractAddress(),
        );
        [coinbase, makerAddress, takerAddress, feeRecipient, senderAddress] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];
        signedOrder = await fillScenarios.createFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            takerAddress,
            fillableAmount,
        );
        anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            takerAddress,
            fillableAmount,
        );
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('encoder', () => {
        describe('#fillOrderAsync', () => {
            it('should fill a valid order', async () => {
                const encoder = await contractWrappers.exchange.executeTransactionEncoderAsync();
                const salt = generatePseudoRandomSalt();
                const signerAddress = takerAddress;
                const data = encoder.fillOrder(signedOrder, takerTokenFillAmount);
                const encodedTransaction = encoder.getExecuteTransactionHex(data, salt, signerAddress);
                const signature = await ecSignOrderHashAsync(
                    provider,
                    encodedTransaction,
                    signerAddress,
                    SignerType.Default,
                );
                txHash = await contractWrappers.exchange.executeTransactionAsync(
                    salt,
                    signerAddress,
                    data,
                    signature,
                    senderAddress,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            });
        });
    });
});
