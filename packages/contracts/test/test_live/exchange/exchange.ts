import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants } from '@0xproject/dev-utils';
import { TxData } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';
import * as path from 'path';
import * as Web3 from 'web3';

import { DummyERC20TokenContract } from '../../../src/contract_wrappers/generated/dummy_e_r_c20_token';
import { DummyERC721TokenContract } from '../../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { ERC20ProxyContract } from '../../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../../src/contract_wrappers/generated/e_r_c721_proxy';
import {
    CancelContractEventArgs,
    ExchangeContract,
    ExchangeStatusContractEventArgs,
    FillContractEventArgs,
} from '../../../src/contract_wrappers/generated/exchange';
import { WETH9Contract } from '../../../src/contract_wrappers/generated/weth9';
import { ZRXTokenContract } from '../../../src/contract_wrappers/generated/zrx_token';
import { artifacts } from '../../../src/utils/artifacts';
import { assetProxyUtils } from '../../../src/utils/asset_proxy_utils';
import { chaiSetup } from '../../../src/utils/chai_setup';
import { constants } from '../../../src/utils/constants';
import { crypto } from '../../../src/utils/crypto';
import { ERC20Wrapper } from '../../../src/utils/erc20_wrapper';
import { ERC721Wrapper } from '../../../src/utils/erc721_wrapper';
import { ExchangeWrapper } from '../../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../../src/utils/order_factory';
import { orderUtils } from '../../../src/utils/order_utils';
import { AssetProxyId, ContractName, ERC20BalancesByOwner, SignatureType, SignedOrder } from '../../../src/utils/types';
import { txDefaults } from '../../../src/utils/web3_wrapper';
import { GanacheConfig, KovanConfig } from '../network_config';
import { web3Factory } from '../web3_factory';

// const networkConfig = KovanConfig;
const networkConfig = GanacheConfig;

const networkId = networkConfig.networkId;
const providerConfigs = networkConfig.providerConfig;
const web3 = web3Factory.create(providerConfigs);
const provider = web3.currentProvider;
const web3Wrapper = new Web3Wrapper(provider);

const deployerOpts = {
    provider,
    artifactsDir: path.resolve('lib', 'src', 'artifacts'),
    networkId,
    defaults: {
        gas: networkConfig.gasEstimate,
        gasPrice: networkConfig.gasPrice,
    },
};

chaiSetup.configure();
const expect = chai.expect;

enum UseCase {
    FILL_ORDER = 'fillOrder',
    FILL_ORDER_PARTIALLY_FILLED = 'fillOrder - partially filled',
    FILL_ORDER_NO_FEES = 'fillOrder - no fees',
    FILL_ORDER_NO_THROW = 'fillOrderNoThrow',
    FILL_ORDERS_UP_TO = 'fillOrdersUpTo',
    MARKET_SELL = 'marketSell',
    MARKET_SELL_2_ORDERS = 'marketSell - 2 orders',
    MARKET_BUY = 'marketBuy',
    MARKET_BUY_2_ORDERS = 'marketBuy - 2 orders',
    FORWARDER_BUY_TOKENS = 'forwarder - buyTokens',
    BATCH_FILL_OR_KILL_NO_FEES = 'batchFillOrKill - no fees - matching',
    CANCEL_ORDER = 'cancelOrder',
}
interface UseCaseResult {
    useCase: UseCase;
    tx: TransactionReceiptWithDecodedLogs;
}

const useCaseResults: UseCaseResult[] = [];
function addUseCaseResult(result: UseCaseResult): void {
    useCaseResults.push(result);
}

describe.only(`${networkConfig.name} Integration Tests`, () => {
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;
    const INITIAL_BALANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);
    const INITIAL_ALLOWANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let weth9Dummy: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let wethToken: WETH9Contract;
    let erc721Token: DummyERC721TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let signedOrder: SignedOrder;
    let erc20Balances: ERC20BalancesByOwner;
    let exchangeWrapper: ExchangeWrapper;
    let orderFactory: OrderFactory;

    // let erc721MakerAssetIds: BigNumber[];
    // let erc721TakerAssetIds: BigNumber[];

    let defaultMakerAssetAddress: string;
    let defaultTakerAssetAddress: string;

    let zeroEx: ZeroEx;

    async function getBalancesAsync(): Promise<ERC20BalancesByOwner> {
        const balancesByOwner: ERC20BalancesByOwner = {};
        const balancePromises: Array<Promise<BigNumber>> = [];
        const balanceInfo: Array<{ tokenOwnerAddress: string; tokenAddress: string }> = [];
        _.forEach([zrxToken, erc20TokenA, erc20TokenB, weth9Dummy], dummyTokenContract => {
            _.forEach([makerAddress, owner, takerAddress, feeRecipientAddress], tokenOwnerAddress => {
                balancePromises.push(dummyTokenContract.balanceOf.callAsync(tokenOwnerAddress));
                balanceInfo.push({
                    tokenOwnerAddress,
                    tokenAddress: dummyTokenContract.address,
                });
            });
        });
        const balances = await Promise.all(balancePromises);
        _.forEach(balances, (balance, balanceIndex) => {
            const tokenAddress = balanceInfo[balanceIndex].tokenAddress;
            const tokenOwnerAddress = balanceInfo[balanceIndex].tokenOwnerAddress;
            if (_.isUndefined(balancesByOwner[tokenOwnerAddress])) {
                balancesByOwner[tokenOwnerAddress] = {};
            }
            const wrappedBalance = new BigNumber(balance);
            balancesByOwner[tokenOwnerAddress][tokenAddress] = wrappedBalance;
        });
        return balancesByOwner;
    }

    async function awaitMined(txPromise: Promise<string>): Promise<void> {
        const txHash = await txPromise;
        await web3Wrapper.awaitTransactionMinedAsync(txHash);
    }

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = accounts);

        // Fund the taker
        const takerEthAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(0.5), 18);
        let tx: TxData = {
            to: takerAddress,
            value: takerEthAmount,
            from: owner,
            gas: networkConfig.gasEstimate,
            gasPrice: networkConfig.gasPrice,
        };
        await awaitMined(web3Wrapper.sendTransactionAsync(tx));
        tx = {
            to: makerAddress,
            value: takerEthAmount,
            from: owner,
            gas: networkConfig.gasEstimate,
            gasPrice: networkConfig.gasPrice,
        };
        await awaitMined(web3Wrapper.sendTransactionAsync(tx));

        const erc20TokenAInstance = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC20Token,
            provider,
            txDefaults,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );
        erc20TokenA = new DummyERC20TokenContract(erc20TokenAInstance.abi, erc20TokenAInstance.address, provider);

        const erc20TokenBInstance = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC20Token,
            provider,
            txDefaults,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );
        erc20TokenB = new DummyERC20TokenContract(erc20TokenBInstance.abi, erc20TokenBInstance.address, provider);

        const erc20ProxyInstance = await ERC20ProxyContract.deployFrom0xArtifactAsync(
            artifacts.ERC20Proxy,
            provider,
            txDefaults,
        );
        erc20Proxy = new ERC20ProxyContract(erc20ProxyInstance.abi, erc20ProxyInstance.address, provider);

        // ERC721
        const erc721TokenInstance = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC721Token,
            provider,
            txDefaults,
            'name',
            'sym',
        );
        erc721Token = new DummyERC721TokenContract(erc721TokenInstance.abi, erc721TokenInstance.address, provider);

        const erc721ProxyInstance = await ERC721ProxyContract.deployFrom0xArtifactAsync(
            artifacts.ERC721Proxy,
            provider,
            txDefaults,
        );
        erc721Proxy = new ERC721ProxyContract(erc721ProxyInstance.abi, erc721ProxyInstance.address, provider);

        // Deploy WETH
        const etherTokenInstance = await WETH9Contract.deployFrom0xArtifactAsync(
            artifacts.EtherToken,
            provider,
            txDefaults,
        );
        wethToken = new WETH9Contract(etherTokenInstance.abi, etherTokenInstance.address, provider);

        // Re-deploy ZRX once
        const zrxInstance = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC20Token,
            provider,
            txDefaults,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );
        zrxToken = new DummyERC20TokenContract(zrxInstance.abi, zrxInstance.address, provider);

        // Deploy and configure Exchange
        const zrxERC20ProxyData = assetProxyUtils.encodeERC20ProxyData(zrxToken.address);
        const exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            zrxERC20ProxyData,
        );
        exchange = new ExchangeContract(exchangeInstance.abi, exchangeInstance.address, provider);
        zeroEx = new ZeroEx(provider, {
            exchangeContractAddress: exchange.address,
            networkId: constants.TESTRPC_NETWORK_ID,
        });
        exchangeWrapper = new ExchangeWrapper(exchange, zeroEx);
        // Exchange Setup
        await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC20, erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC721, erc721Proxy.address, owner);
        await awaitMined(
            erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
        );
        await awaitMined(
            erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
        );

        defaultMakerAssetAddress = zrxToken.address;
        defaultTakerAssetAddress = wethToken.address;

        const defaultOrderParams = {
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0.01), 18),
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultMakerAssetAddress),
            takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultTakerAssetAddress),
        };

        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        // Set balances and approvals
        await awaitMined(zrxToken.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: owner }));
        await awaitMined(zrxToken.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: owner }));
        await awaitMined(
            zrxToken.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
        );
        await awaitMined(
            zrxToken.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            }),
        );
        await awaitMined(
            wethToken.deposit.sendTransactionAsync({ from: takerAddress, value: takerEthAmount.dividedBy(2) }),
        );
        await awaitMined(
            wethToken.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            }),
        );
        await awaitMined(
            erc20TokenA.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
        );
        await awaitMined(
            erc20TokenA.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            }),
        );
        weth9Dummy = new DummyERC20TokenContract(wethToken.abi, wethToken.address, provider);
    });
    after(async () => {
        _.each(useCaseResults, result => {
            if (_.isUndefined(result.tx) || result.tx.status === 0) {
                // tslint:disable-next-line:no-console
                console.log('ERR:', result.useCase, result.tx);
            } else {
                // tslint:disable-next-line:no-console
                console.log(result.useCase, result.tx.transactionHash, result.tx.gasUsed);
            }
        });
        const takerWETHBalance = await wethToken.balanceOf.callAsync(takerAddress);
        const makerWETHBalance = await wethToken.balanceOf.callAsync(makerAddress);
        await wethToken.withdraw.sendTransactionAsync(takerWETHBalance, { from: takerAddress });
        await wethToken.withdraw.sendTransactionAsync(makerWETHBalance, { from: makerAddress });
    });
    describe('Live Tests', () => {
        beforeEach(async () => {
            erc20Balances = await getBalancesAsync();
            signedOrder = orderFactory.newSignedOrder();
        });
        it('Warmup', async () => {
            let tx;
            // Fill
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            tx = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            expect(tx.status).to.be.eq(1);
            // Cancel
            signedOrder = orderFactory.newSignedOrder();
            tx = await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(tx.status).to.be.eq(1);
        });
        it(UseCase.FILL_ORDER, async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            const tx = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            addUseCaseResult({ useCase: UseCase.FILL_ORDER, tx });
            expect(tx.status).to.be.eq(1);
        });
        it(UseCase.FILL_ORDER_PARTIALLY_FILLED, async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            const tx = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            addUseCaseResult({ useCase: UseCase.FILL_ORDER_PARTIALLY_FILLED, tx });
            expect(tx.status).to.be.eq(1);
        });
        it(UseCase.FILL_ORDER_NO_FEES, async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(0), 18),
                takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(0), 18),
            });
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            const tx = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            addUseCaseResult({ useCase: UseCase.FILL_ORDER_NO_FEES, tx });
            expect(tx.status).to.be.eq(1);
        });
        it(UseCase.MARKET_SELL, async () => {
            signedOrder = orderFactory.newSignedOrder();
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            const tx = await exchangeWrapper.marketSellOrdersAsync([signedOrder], takerAddress, {
                takerAssetFillAmount,
            });
            addUseCaseResult({ useCase: UseCase.MARKET_SELL, tx });
            expect(tx.status).to.be.eq(1);
        });
        it(UseCase.MARKET_SELL_2_ORDERS, async () => {
            const signedOrder2 = orderFactory.newSignedOrder();
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            const tx = await exchangeWrapper.marketSellOrdersAsync([signedOrder, signedOrder2], takerAddress, {
                takerAssetFillAmount,
            });
            addUseCaseResult({ useCase: UseCase.MARKET_SELL_2_ORDERS, tx });
            expect(tx.status).to.be.eq(1);
        });
        it(UseCase.MARKET_BUY, async () => {
            const signedOrders = [orderFactory.newSignedOrder()];
            const makerAssetFillAmount = signedOrders[0].makerAssetAmount;
            const tx = await exchangeWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                makerAssetFillAmount,
            });
            addUseCaseResult({ useCase: UseCase.MARKET_BUY, tx });
            expect(tx.status).to.be.eq(1);
        });
        it(UseCase.MARKET_BUY_2_ORDERS, async () => {
            const signedOrders = [orderFactory.newSignedOrder(), orderFactory.newSignedOrder()];
            const makerAssetFillAmount = signedOrders[0].makerAssetAmount.plus(signedOrders[1].makerAssetAmount.div(2));
            const tx = await exchangeWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                makerAssetFillAmount,
            });
            addUseCaseResult({ useCase: UseCase.MARKET_BUY_2_ORDERS, tx });
            expect(tx.status).to.be.eq(1);
        });
        it(UseCase.FILL_ORDER_NO_THROW, async () => {
            signedOrder = orderFactory.newSignedOrder();
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            const tx = await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            addUseCaseResult({ useCase: UseCase.FILL_ORDER_NO_THROW, tx });
            expect(tx.status).to.be.eq(1);
        });
        // it(UseCase.FORWARDER_BUY_TOKENS, async () => {
        //     const orderWithFees = orderFactory.newSignedOrder({
        //         takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
        //         takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0.03), 18),
        //     });
        //     const feeOrder = orderFactory.newSignedOrder({
        //         takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0.003), 18),
        //         takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
        //     });
        //     const fillAmount = orderWithFees.takerAssetAmount.div(2);
        //     const txHash = await forwarderWrapper.buyTokensAsync([orderWithFees], [feeOrder], fillAmount, takerAddress);
        //     const tx = await zeroEx.awaitTransactionMinedAsync(txHash);
        //     addUseCaseResult({ useCase: UseCase.FORWARDER_BUY_TOKENS, tx });
        //     expect(tx.status).to.be.eq(1);
        // });
        it(UseCase.CANCEL_ORDER, async () => {
            signedOrder = orderFactory.newSignedOrder();
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            const tx = await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            addUseCaseResult({ useCase: UseCase.CANCEL_ORDER, tx });
            expect(tx.status).to.be.eq(1);
        });
    });
});
