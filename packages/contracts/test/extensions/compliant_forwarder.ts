import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { RevertReason, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { DummyERC20TokenContract } from '../../generated-wrappers/dummy_erc20_token';
import { ExchangeContract } from '../../generated-wrappers/exchange';
import { CompliantForwarderContract } from '../../generated-wrappers/compliant_forwarder';
import { YesComplianceTokenContract } from '../../generated-wrappers/yes_compliance_token';

import { WETH9Contract } from '../../generated-wrappers/weth9';
import { artifacts } from '../../src/artifacts';
import {
    expectContractCreationFailedAsync,
    expectTransactionFailedAsync,
    sendTransactionResult,
} from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { ERC721Wrapper } from '../utils/erc721_wrapper';
import { ExchangeWrapper } from '../utils/exchange_wrapper';
import { ForwarderWrapper } from '../utils/forwarder_wrapper';
import { OrderFactory } from '../utils/order_factory';
import { orderUtils } from '../utils/order_utils';
import { TransactionFactory } from '../utils/transaction_factory';
import { ContractName, ERC20BalancesByOwner, SignedTransaction } from '../utils/types';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const DECIMALS_DEFAULT = 18;
const MAX_WETH_FILL_PERCENTAGE = 95;

describe.only(ContractName.Forwarder, () => {
    let compliantMakerAddress: string;
    let owner: string;
    let compliantTakerAddress: string;
    let feeRecipientAddress: string;
    let noncompliantAddress: string;
    let defaultMakerAssetAddress: string;
    let zrxAssetData: string;
    let wethAssetData: string;

    let weth: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc20TokenA: DummyERC20TokenContract;
    let yesComplianceToken: YesComplianceTokenContract;
    let compliantForwarderContract: CompliantForwarderContract;
    let wethContract: WETH9Contract;
    let forwarderWrapper: ForwarderWrapper;
    let exchangeWrapper: ExchangeWrapper;

    let orderWithoutFee: SignedOrder;
    let orderWithFee: SignedOrder;
    let feeOrder: SignedOrder;
    let orderFactory: OrderFactory;
    let erc20Wrapper: ERC20Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let tx: TransactionReceiptWithDecodedLogs;

    let makerAssetAddress: string;
    let takerAssetAddress: string;

    let erc721MakerAssetIds: BigNumber[];
    let takerEthBalanceBefore: BigNumber;
    let feePercentage: BigNumber;

    let compliantSignedOrder: SignedOrder;
    let compliantSignedFillOrderTx: SignedTransaction;
    let noncompliantSignedFillOrderTx: SignedTransaction;

    const compliantMakerCountryCode = new BigNumber(519);
    const compliantMakerYesMark = new BigNumber(1);
    const compliantMakerEntityId = new BigNumber(2);
    let compliantMakerYesTokenId;

    const compliantTakerCountryCode = new BigNumber(519);
    const compliantTakerYesMark = new BigNumber(1);
    const compliantTakerEntityId = new BigNumber(2);
    let compliantTakerYesTokenId;

    const takerAssetAmount =  Web3Wrapper.toBaseUnitAmount(new BigNumber(500), DECIMALS_DEFAULT);
    const makerAssetAmount =  Web3Wrapper.toBaseUnitAmount(new BigNumber(1000), DECIMALS_DEFAULT);
    const takerAssetFillAmount =  Web3Wrapper.toBaseUnitAmount(new BigNumber(250), DECIMALS_DEFAULT);
    const salt = new BigNumber(0);

    let compliantForwarderInstance: CompliantForwarderContract;

    before(async () => {
        // Create accounts
        await blockchainLifecycle.startAsync();
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, compliantMakerAddress, compliantTakerAddress, feeRecipientAddress, noncompliantAddress] = accounts);
        // Create wrappers
        const erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);
        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        // Deploy ERC20 tokens
        const numDummyErc20ToDeploy = 3;
        let erc20TokenA: DummyERC20TokenContract;
        let erc20TokenB: DummyERC20TokenContract;
        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        makerAssetAddress = erc20TokenA.address;
        takerAssetAddress = erc20TokenB.address;
        // Deploy Yes Token
        const yesTokenInstance =  await YesComplianceTokenContract.deployFrom0xArtifactAsync(
            artifacts.YesComplianceToken,
            provider,
            txDefaults,
        );
        compliantForwarderContract = new CompliantForwarderContract(
            yesTokenInstance.abi,
            yesTokenInstance.address,
            provider,
        );
        // Create proxies
        const erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // Deploy tokens & set asset data
        wethContract = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.WETH9, provider, txDefaults);
        weth = new DummyERC20TokenContract(wethContract.abi, wethContract.address, provider);
        erc20Wrapper.addDummyTokenContract(weth);
        wethAssetData = assetDataUtils.encodeERC20AssetData(wethContract.address);
        zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
        // Deploy Exchange congtract
        const exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            zrxAssetData,
        );
        exchangeWrapper = new ExchangeWrapper(exchangeInstance, provider);
        // Register proxies
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: owner,
        });
        // Default order parameters
        defaultMakerAssetAddress = erc20TokenA.address;
        const defaultTakerAssetAddress = wethContract.address;
        const defaultOrderParams = {
            exchangeAddress: exchangeInstance.address,
            compliantMakerAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerAssetAmount: makerAssetAmount,
            takerAssetAmount: takerAssetAmount,
            makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(compliantMakerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        // Deploy Compliant Forwarder
        compliantForwarderInstance = await CompliantForwarderContract.deployFrom0xArtifactAsync(
            artifacts.CompliantForwarder,
            provider,
            txDefaults,
            exchangeInstance.address,
            yesTokenInstance.address,
        );
        compliantForwarderContract = new CompliantForwarderContract(
            compliantForwarderInstance.abi,
            compliantForwarderInstance.address,
            provider,
        );
        /*
        forwarderWrapper = new ForwarderWrapper(compliantForwarderContract, provider);
        */
       // Verify Maker / Taker
       const addressesCanControlTheirToken = true;
       compliantMakerYesTokenId = await yesTokenInstance.mint2.sendTransactionAsync(compliantMakerAddress, compliantMakerEntityId, addressesCanControlTheirToken, compliantMakerCountryCode, [compliantMakerYesMark]);
       compliantTakerYesTokenId = await yesTokenInstance.mint2.sendTransactionAsync(compliantTakerAddress, compliantTakerEntityId, addressesCanControlTheirToken, compliantTakerCountryCode, [compliantTakerYesMark]);
        // Create Valid/Invalid orders
        const takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(compliantTakerAddress)];
        const takerTransactionFactory = new TransactionFactory(takerPrivateKey, exchangeInstance.address);
        compliantSignedOrder = await orderFactory.newSignedOrderAsync({
            senderAddress: compliantForwarderContract.address,
        });
        const compliantSignedOrderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(compliantSignedOrder);
        const compliantSignedOrderWithoutExchangeAddressData = exchangeInstance.fillOrder.getABIEncodedTransactionData(
            compliantSignedOrderWithoutExchangeAddress,
            takerAssetFillAmount,
            compliantSignedOrder.signature,
        );
        compliantSignedFillOrderTx = takerTransactionFactory.newSignedTransaction(compliantSignedOrderWithoutExchangeAddressData);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe.only('fillOrder', () => {
        let takerAssetFillAmount: BigNumber;
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
        });

        // @TODO: Should fail if order's senderAddress is not set to the compliant forwarding contract
        // @TODO: Should fail if the 

        it.only('should transfer the correct amounts when maker and taker are verified', async () => {
            await compliantForwarderInstance.fillOrder.sendTransactionAsync(compliantSignedFillOrderTx.salt, compliantSignedFillOrderTx.signerAddress, compliantSignedFillOrderTx.data, compliantSignedFillOrderTx.signature);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount = takerAssetFillAmount
                .times(compliantSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const makerFeePaid = compliantSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            expect(newBalances[compliantMakerAddress][makerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][makerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][takerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][takerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[compliantTakerAddress][takerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][takerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][makerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][makerAssetAddress].add(makerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
