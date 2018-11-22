import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { RevertReason, SignatureType, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { DummyERC20TokenContract, DummyERC20TokenTransferEventArgs } from '../../generated-wrappers/dummy_erc20_token';
import { DummyERC721TokenContract } from '../../generated-wrappers/dummy_erc721_token';
import { DummyNoReturnERC20TokenContract } from '../../generated-wrappers/dummy_no_return_erc20_token';
import { ERC20ProxyContract } from '../../generated-wrappers/erc20_proxy';
import { ERC721ProxyContract } from '../../generated-wrappers/erc721_proxy';
import { ExchangeCancelEventArgs, ExchangeContract } from '../../generated-wrappers/exchange';
import { ReentrantERC20TokenContract } from '../../generated-wrappers/reentrant_erc20_token';
import { TestStaticCallReceiverContract } from '../../generated-wrappers/test_static_call_receiver';
import { artifacts } from '../../src/artifacts';
import { expectTransactionFailedAsync } from '../utils/assertions';
import { getLatestBlockTimestampAsync, increaseTimeAndMineBlockAsync } from '../utils/block_timestamp';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { ERC721Wrapper } from '../utils/erc721_wrapper';
import { ExchangeWrapper } from '../utils/exchange_wrapper';
import { OrderFactory } from '../utils/order_factory';
import { ERC20BalancesByOwner, OrderStatus } from '../utils/types';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('Exchange core', () => {
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let noReturnErc20Token: DummyNoReturnERC20TokenContract;
    let reentrantErc20Token: ReentrantERC20TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let maliciousWallet: TestStaticCallReceiverContract;
    let maliciousValidator: TestStaticCallReceiverContract;

    let signedOrder: SignedOrder;
    let erc20Balances: ERC20BalancesByOwner;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let orderFactory: OrderFactory;

    let erc721MakerAssetIds: BigNumber[];
    let erc721TakerAssetIds: BigNumber[];

    let defaultMakerAssetAddress: string;
    let defaultTakerAssetAddress: string;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = _.slice(accounts, 0, 4));

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerAssetIds = erc721Balances[makerAddress][erc721Token.address];
        erc721TakerAssetIds = erc721Balances[takerAddress][erc721Token.address];

        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            assetDataUtils.encodeERC20AssetData(zrxToken.address),
        );
        exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);

        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        maliciousWallet = maliciousValidator = await TestStaticCallReceiverContract.deployFrom0xArtifactAsync(
            artifacts.TestStaticCallReceiver,
            provider,
            txDefaults,
        );
        reentrantErc20Token = await ReentrantERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.ReentrantERC20Token,
            provider,
            txDefaults,
            exchange.address,
        );

        defaultMakerAssetAddress = erc20TokenA.address;
        defaultTakerAssetAddress = erc20TokenB.address;

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('fillOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        const reentrancyTest = (functionNames: string[]) => {
            _.forEach(functionNames, async (functionName: string, functionId: number) => {
                const description = `should not allow fillOrder to reenter the Exchange contract via ${functionName}`;
                it(description, async () => {
                    signedOrder = await orderFactory.newSignedOrderAsync({
                        makerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                    });
                    await web3Wrapper.awaitTransactionSuccessAsync(
                        await reentrantErc20Token.setCurrentFunction.sendTransactionAsync(functionId),
                        constants.AWAIT_TRANSACTION_MINED_MS,
                    );
                    await expectTransactionFailedAsync(
                        exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
                        RevertReason.TransferFailed,
                    );
                });
            });
        };
        describe('fillOrder reentrancy tests', () => reentrancyTest(constants.FUNCTIONS_WITH_MUTEX));

        it('should throw if signature is invalid', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });

            const v = ethUtil.toBuffer(signedOrder.signature.slice(0, 4));
            const invalidR = ethUtil.sha3('invalidR');
            const invalidS = ethUtil.sha3('invalidS');
            const signatureType = ethUtil.toBuffer(`0x${signedOrder.signature.slice(-2)}`);
            const invalidSigBuff = Buffer.concat([v, invalidR, invalidS, signatureType]);
            const invalidSigHex = `0x${invalidSigBuff.toString('hex')}`;
            signedOrder.signature = invalidSigHex;
            return expectTransactionFailedAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
                RevertReason.InvalidOrderSignature,
            );
        });

        it('should throw if no value is filled', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            return expectTransactionFailedAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
                RevertReason.OrderUnfillable,
            );
        });

        it('should revert if `isValidSignature` tries to update state when SignatureType=Wallet', async () => {
            const maliciousMakerAddress = maliciousWallet.address;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20TokenA.setBalance.sendTransactionAsync(
                    maliciousMakerAddress,
                    constants.INITIAL_ERC20_BALANCE,
                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await maliciousWallet.approveERC20.sendTransactionAsync(
                    erc20TokenA.address,
                    erc20Proxy.address,
                    constants.INITIAL_ERC20_ALLOWANCE,
                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAddress: maliciousMakerAddress,
                makerFee: constants.ZERO_AMOUNT,
            });
            signedOrder.signature = `0x0${SignatureType.Wallet}`;
            await expectTransactionFailedAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
                RevertReason.WalletError,
            );
        });

        it('should revert if `isValidSignature` tries to update state when SignatureType=Validator', async () => {
            const isApproved = true;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await exchange.setSignatureValidatorApproval.sendTransactionAsync(
                    maliciousValidator.address,
                    isApproved,
                    { from: makerAddress },
                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            signedOrder.signature = `${maliciousValidator.address}0${SignatureType.Validator}`;
            await expectTransactionFailedAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
                RevertReason.ValidatorError,
            );
        });

        it('should not emit transfer events for transfers where from == to', async () => {
            const txReceipt = await exchangeWrapper.fillOrderAsync(signedOrder, makerAddress);
            const logs = txReceipt.logs;
            const transferLogs = _.filter(
                logs,
                log => (log as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).event === 'Transfer',
            );
            expect(transferLogs.length).to.be.equal(2);
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                zrxToken.address,
            );
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                makerAddress,
            );
            expect((transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                feeRecipientAddress,
            );
            expect(
                (transferLogs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.makerFee);
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).address).to.be.equal(
                zrxToken.address,
            );
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._from).to.be.equal(
                makerAddress,
            );
            expect((transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._to).to.be.equal(
                feeRecipientAddress,
            );
            expect(
                (transferLogs[1] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>).args._value,
            ).to.be.bignumber.equal(signedOrder.takerFee);
        });
    });

    describe('Testing exchange of ERC20 tokens with no return values', () => {
        before(async () => {
            noReturnErc20Token = await DummyNoReturnERC20TokenContract.deployFrom0xArtifactAsync(
                artifacts.DummyNoReturnERC20Token,
                provider,
                txDefaults,
                constants.DUMMY_TOKEN_NAME,
                constants.DUMMY_TOKEN_SYMBOL,
                constants.DUMMY_TOKEN_DECIMALS,
                constants.DUMMY_TOKEN_TOTAL_SUPPLY,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await noReturnErc20Token.setBalance.sendTransactionAsync(makerAddress, constants.INITIAL_ERC20_BALANCE),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await noReturnErc20Token.approve.sendTransactionAsync(
                    erc20Proxy.address,
                    constants.INITIAL_ERC20_ALLOWANCE,
                    { from: makerAddress },
                ),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
        });
        it('should transfer the correct amounts when makerAssetAmount === takerAssetAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(noReturnErc20Token.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const initialMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialMakerZrxBalance = await zrxToken.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const initialTakerZrxBalance = await zrxToken.balanceOf.callAsync(takerAddress);
            const initialFeeRecipientZrxBalance = await zrxToken.balanceOf.callAsync(feeRecipientAddress);

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const finalMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalMakerZrxBalance = await zrxToken.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const finalTakerZrxBalance = await zrxToken.balanceOf.callAsync(takerAddress);
            const finalFeeRecipientZrxBalance = await zrxToken.balanceOf.callAsync(feeRecipientAddress);

            expect(finalMakerBalanceA).to.be.bignumber.equal(initialMakerBalanceA.minus(signedOrder.makerAssetAmount));
            expect(finalMakerBalanceB).to.be.bignumber.equal(initialMakerBalanceB.plus(signedOrder.takerAssetAmount));
            expect(finalTakerBalanceA).to.be.bignumber.equal(initialTakerBalanceA.plus(signedOrder.makerAssetAmount));
            expect(finalTakerBalanceB).to.be.bignumber.equal(initialTakerBalanceB.minus(signedOrder.takerAssetAmount));
            expect(finalMakerZrxBalance).to.be.bignumber.equal(initialMakerZrxBalance.minus(signedOrder.makerFee));
            expect(finalTakerZrxBalance).to.be.bignumber.equal(initialTakerZrxBalance.minus(signedOrder.takerFee));
            expect(finalFeeRecipientZrxBalance).to.be.bignumber.equal(
                initialFeeRecipientZrxBalance.plus(signedOrder.makerFee.plus(signedOrder.takerFee)),
            );
        });
        it('should transfer the correct amounts when makerAssetAmount > takerAssetAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(noReturnErc20Token.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const initialMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialMakerZrxBalance = await zrxToken.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const initialTakerZrxBalance = await zrxToken.balanceOf.callAsync(takerAddress);
            const initialFeeRecipientZrxBalance = await zrxToken.balanceOf.callAsync(feeRecipientAddress);

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const finalMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalMakerZrxBalance = await zrxToken.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const finalTakerZrxBalance = await zrxToken.balanceOf.callAsync(takerAddress);
            const finalFeeRecipientZrxBalance = await zrxToken.balanceOf.callAsync(feeRecipientAddress);

            expect(finalMakerBalanceA).to.be.bignumber.equal(initialMakerBalanceA.minus(signedOrder.makerAssetAmount));
            expect(finalMakerBalanceB).to.be.bignumber.equal(initialMakerBalanceB.plus(signedOrder.takerAssetAmount));
            expect(finalTakerBalanceA).to.be.bignumber.equal(initialTakerBalanceA.plus(signedOrder.makerAssetAmount));
            expect(finalTakerBalanceB).to.be.bignumber.equal(initialTakerBalanceB.minus(signedOrder.takerAssetAmount));
            expect(finalMakerZrxBalance).to.be.bignumber.equal(initialMakerZrxBalance.minus(signedOrder.makerFee));
            expect(finalTakerZrxBalance).to.be.bignumber.equal(initialTakerZrxBalance.minus(signedOrder.takerFee));
            expect(finalFeeRecipientZrxBalance).to.be.bignumber.equal(
                initialFeeRecipientZrxBalance.plus(signedOrder.makerFee.plus(signedOrder.takerFee)),
            );
        });
        it('should transfer the correct amounts when makerAssetAmount < takerAssetAmount', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(noReturnErc20Token.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const initialMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const initialMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const initialMakerZrxBalance = await zrxToken.balanceOf.callAsync(makerAddress);
            const initialTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const initialTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const initialTakerZrxBalance = await zrxToken.balanceOf.callAsync(takerAddress);
            const initialFeeRecipientZrxBalance = await zrxToken.balanceOf.callAsync(feeRecipientAddress);

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const finalMakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
            const finalMakerBalanceB = await erc20TokenB.balanceOf.callAsync(makerAddress);
            const finalMakerZrxBalance = await zrxToken.balanceOf.callAsync(makerAddress);
            const finalTakerBalanceA = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
            const finalTakerBalanceB = await erc20TokenB.balanceOf.callAsync(takerAddress);
            const finalTakerZrxBalance = await zrxToken.balanceOf.callAsync(takerAddress);
            const finalFeeRecipientZrxBalance = await zrxToken.balanceOf.callAsync(feeRecipientAddress);

            expect(finalMakerBalanceA).to.be.bignumber.equal(initialMakerBalanceA.minus(signedOrder.makerAssetAmount));
            expect(finalMakerBalanceB).to.be.bignumber.equal(initialMakerBalanceB.plus(signedOrder.takerAssetAmount));
            expect(finalTakerBalanceA).to.be.bignumber.equal(initialTakerBalanceA.plus(signedOrder.makerAssetAmount));
            expect(finalTakerBalanceB).to.be.bignumber.equal(initialTakerBalanceB.minus(signedOrder.takerAssetAmount));
            expect(finalMakerZrxBalance).to.be.bignumber.equal(initialMakerZrxBalance.minus(signedOrder.makerFee));
            expect(finalTakerZrxBalance).to.be.bignumber.equal(initialTakerZrxBalance.minus(signedOrder.takerFee));
            expect(finalFeeRecipientZrxBalance).to.be.bignumber.equal(
                initialFeeRecipientZrxBalance.plus(signedOrder.makerFee.plus(signedOrder.takerFee)),
            );
        });
    });

    describe('cancelOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            signedOrder = await orderFactory.newSignedOrderAsync();
        });

        it('should throw if not sent by maker', async () => {
            return expectTransactionFailedAsync(
                exchangeWrapper.cancelOrderAsync(signedOrder, takerAddress),
                RevertReason.InvalidMaker,
            );
        });

        it('should throw if makerAssetAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(0),
            });

            return expectTransactionFailedAsync(
                exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress),
                RevertReason.OrderUnfillable,
            );
        });

        it('should throw if takerAssetAmount is 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                takerAssetAmount: new BigNumber(0),
            });

            return expectTransactionFailedAsync(
                exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress),
                RevertReason.OrderUnfillable,
            );
        });

        it('should be able to cancel a full order', async () => {
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            return expectTransactionFailedAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                    takerAssetFillAmount: signedOrder.takerAssetAmount.div(2),
                }),
                RevertReason.OrderUnfillable,
            );
        });

        it('should log 1 event with correct arguments', async () => {
            const res = await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<ExchangeCancelEventArgs>;
            const logArgs = log.args;

            expect(signedOrder.makerAddress).to.be.equal(logArgs.makerAddress);
            expect(signedOrder.makerAddress).to.be.equal(logArgs.senderAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerAssetData).to.be.equal(logArgs.makerAssetData);
            expect(signedOrder.takerAssetData).to.be.equal(logArgs.takerAssetData);
            expect(orderHashUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should throw if already cancelled', async () => {
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            return expectTransactionFailedAsync(
                exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress),
                RevertReason.OrderUnfillable,
            );
        });

        it('should throw if order is expired', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            signedOrder = await orderFactory.newSignedOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).sub(10),
            });
            return expectTransactionFailedAsync(
                exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress),
                RevertReason.OrderUnfillable,
            );
        });

        it('should throw if rounding error is greater than 0.1%', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1001),
                takerAssetAmount: new BigNumber(3),
            });

            const fillTakerAssetAmount1 = new BigNumber(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: fillTakerAssetAmount1,
            });

            const fillTakerAssetAmount2 = new BigNumber(1);
            return expectTransactionFailedAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                    takerAssetFillAmount: fillTakerAssetAmount2,
                }),
                RevertReason.RoundingError,
            );
        });
    });

    describe('cancelOrdersUpTo', () => {
        it('should fail to set orderEpoch less than current orderEpoch', async () => {
            const orderEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress);
            const lesserOrderEpoch = new BigNumber(0);
            return expectTransactionFailedAsync(
                exchangeWrapper.cancelOrdersUpToAsync(lesserOrderEpoch, makerAddress),
                RevertReason.InvalidNewOrderEpoch,
            );
        });

        it('should fail to set orderEpoch equal to existing orderEpoch', async () => {
            const orderEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress);
            return expectTransactionFailedAsync(
                exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress),
                RevertReason.InvalidNewOrderEpoch,
            );
        });

        it('should cancel only orders with a orderEpoch less than existing orderEpoch', async () => {
            // Cancel all transactions with a orderEpoch less than 1
            const orderEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress);

            // Create 3 orders with orderEpoch values: 0,1,2,3
            // Since we cancelled with orderEpoch=1, orders with orderEpoch<=1 will not be processed
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            const signedOrders = [
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(9), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(9), 18),
                    salt: new BigNumber(0),
                }),
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(79), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(79), 18),
                    salt: new BigNumber(1),
                }),
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(979), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(979), 18),
                    salt: new BigNumber(2),
                }),
                await orderFactory.newSignedOrderAsync({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(7979), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(7979), 18),
                    salt: new BigNumber(3),
                }),
            ];
            await exchangeWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress, {
                // HACK(albrow): We need to hardcode the gas estimate here because
                // the Geth gas estimator doesn't work with the way we use
                // delegatecall and swallow errors.
                gas: 600000,
            });

            const newBalances = await erc20Wrapper.getBalancesAsync();
            const fillMakerAssetAmount = signedOrders[2].makerAssetAmount.add(signedOrders[3].makerAssetAmount);
            const fillTakerAssetAmount = signedOrders[2].takerAssetAmount.add(signedOrders[3].takerAssetAmount);
            const makerFee = signedOrders[2].makerFee.add(signedOrders[3].makerFee);
            const takerFee = signedOrders[2].takerFee.add(signedOrders[3].takerFee);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(fillMakerAssetAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].add(fillTakerAssetAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(fillTakerAssetAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].add(fillMakerAssetAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFee.add(takerFee)),
            );
        });
    });

    describe('Testing Exchange of ERC721 Tokens', () => {
        it('should throw when maker does not own the token with id makerAssetId', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721TakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[1];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.not.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expectTransactionFailedAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
                RevertReason.TransferFailed,
            );
        });

        it('should throw when taker does not own the token with id takerAssetId', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721MakerAssetIds[1];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.not.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expectTransactionFailedAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
                RevertReason.TransferFailed,
            );
        });

        it('should throw when makerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(2),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expectTransactionFailedAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
                RevertReason.InvalidAmount,
            );
        });

        it('should throw when takerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(500),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expectTransactionFailedAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
                RevertReason.InvalidAmount,
            );
        });

        it('should throw on partial fill', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            });
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            return expectTransactionFailedAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
                RevertReason.RoundingError,
            );
        });
    });

    describe('getOrderInfo', () => {
        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should return the correct orderInfo for an unfilled valid order', async () => {
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.FILLABLE;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for a fully filled order', async () => {
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = signedOrder.takerAssetAmount;
            const expectedOrderStatus = OrderStatus.FULLY_FILLED;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for a partially filled order', async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = takerAssetFillAmount;
            const expectedOrderStatus = OrderStatus.FILLABLE;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for a cancelled and unfilled order', async () => {
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.CANCELLED;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for a cancelled and partially filled order', async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = takerAssetFillAmount;
            const expectedOrderStatus = OrderStatus.CANCELLED;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an expired and unfilled order', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const timeUntilExpiration = signedOrder.expirationTimeSeconds.minus(currentTimestamp).toNumber();
            await increaseTimeAndMineBlockAsync(timeUntilExpiration);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.EXPIRED;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an expired and partially filled order', async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const timeUntilExpiration = signedOrder.expirationTimeSeconds.minus(currentTimestamp).toNumber();
            await increaseTimeAndMineBlockAsync(timeUntilExpiration);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = takerAssetFillAmount;
            const expectedOrderStatus = OrderStatus.EXPIRED;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an expired and fully filled order', async () => {
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const timeUntilExpiration = signedOrder.expirationTimeSeconds.minus(currentTimestamp).toNumber();
            await increaseTimeAndMineBlockAsync(timeUntilExpiration);
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = signedOrder.takerAssetAmount;
            // FULLY_FILLED takes precedence over EXPIRED
            const expectedOrderStatus = OrderStatus.FULLY_FILLED;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an order with a makerAssetAmount of 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetAmount: new BigNumber(0) });
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.INVALID_MAKER_ASSET_AMOUNT;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
        it('should return the correct orderInfo for an order with a takerAssetAmount of 0', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({ takerAssetAmount: new BigNumber(0) });
            const orderInfo = await exchangeWrapper.getOrderInfoAsync(signedOrder);
            const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const expectedTakerAssetFilledAmount = new BigNumber(0);
            const expectedOrderStatus = OrderStatus.INVALID_TAKER_ASSET_AMOUNT;
            expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
            expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
            expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
