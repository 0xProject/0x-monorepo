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
import { ContractName, ERC20BalancesByOwner } from '../utils/types';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const DECIMALS_DEFAULT = 18;
const MAX_WETH_FILL_PERCENTAGE = 95;

describe(ContractName.Forwarder, () => {
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;
    let otherAddress: string;
    let defaultMakerAssetAddress: string;
    let zrxAssetData: string;
    let wethAssetData: string;

    let weth: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc20TokenA: DummyERC20TokenContract;
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

    let erc721MakerAssetIds: BigNumber[];
    let takerEthBalanceBefore: BigNumber;
    let feePercentage: BigNumber;
    let gasPrice: BigNumber;

    before(async () => {
        await blockchainLifecycle.startAsync();
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress, otherAddress] = accounts);

        const txHash = await web3Wrapper.sendTransactionAsync({ from: accounts[0], to: accounts[0], value: 0 });
        const transaction = await web3Wrapper.getTransactionByHashAsync(txHash);
        gasPrice = new BigNumber(transaction.gasPrice);

        const erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);
        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        const erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        wethContract = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.WETH9, provider, txDefaults);
        weth = new DummyERC20TokenContract(wethContract.abi, wethContract.address, provider);
        erc20Wrapper.addDummyTokenContract(weth);

        wethAssetData = assetDataUtils.encodeERC20AssetData(wethContract.address);
        zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
        const exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            zrxAssetData,
        );
        exchangeWrapper = new ExchangeWrapper(exchangeInstance, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);

        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: owner,
        });

        defaultMakerAssetAddress = erc20TokenA.address;
        const defaultTakerAssetAddress = wethContract.address;
        const defaultOrderParams = {
            exchangeAddress: exchangeInstance.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), DECIMALS_DEFAULT),
            takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), DECIMALS_DEFAULT),
            makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);

        const compliantForwarderInstance = await CompliantForwarderContract.deployFrom0xArtifactAsync(
            artifacts.CompliantForwarder,
            provider,
            txDefaults,
            exchangeInstance.address,
            exchangeInstance.address, // @TODO CHANGE to Yes Token
        );

        compliantForwarderContract = new CompliantForwarderContract(
            compliantForwarderInstance.abi,
            compliantForwarderInstance.address,
            provider,
        );
        /*
        forwarderWrapper = new ForwarderWrapper(compliantForwarderContract, provider);
        */

        const zrxDepositAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(10000), 18);
        await web3Wrapper.awaitTransactionSuccessAsync(
            await zrxToken.transfer.sendTransactionAsync(compliantForwarderContract.address, zrxDepositAmount),
        );
        erc20Wrapper.addTokenOwnerAddress(compliantForwarderInstance.address);
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        erc20Balances = await erc20Wrapper.getBalancesAsync();
        takerEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
        orderWithoutFee = await orderFactory.newSignedOrderAsync();
        feeOrder = await orderFactory.newSignedOrderAsync({
            makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
        });
        orderWithFee = await orderFactory.newSignedOrderAsync({
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
        });
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('constructor', () => {
        it('should revert if assetProxy is unregistered', async () => {});
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
