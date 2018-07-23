import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { assetDataUtils } from '@0xproject/order-utils';
import { RevertReason, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { DummyERC20TokenContract } from '../../generated_contract_wrappers/dummy_erc20_token';
import { DummyERC721TokenContract } from '../../generated_contract_wrappers/dummy_erc721_token';
import { ExchangeContract } from '../../generated_contract_wrappers/exchange';
import { ForwarderContract } from '../../generated_contract_wrappers/forwarder';
import { WETH9Contract } from '../../generated_contract_wrappers/weth9';
import { artifacts } from '../utils/artifacts';
import { expectTransactionFailedAsync } from '../utils/assertions';
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

    let weth: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let forwarderContract: ForwarderContract;
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
        let erc20TokenA;
        [erc20TokenA, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        const erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        const erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerAssetIds = erc721Balances[makerAddress][erc721Token.address];

        wethContract = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.EtherToken, provider, txDefaults);
        weth = new DummyERC20TokenContract(wethContract.abi, wethContract.address, provider);
        erc20Wrapper.addDummyTokenContract(weth);

        const wethAssetData = assetDataUtils.encodeERC20AssetData(wethContract.address);
        const zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
        const exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            zrxAssetData,
        );
        const exchangeContract = new ExchangeContract(exchangeInstance.abi, exchangeInstance.address, provider);
        exchangeWrapper = new ExchangeWrapper(exchangeContract, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);

        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: owner,
        });
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
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

        const forwarderInstance = await ForwarderContract.deployFrom0xArtifactAsync(
            artifacts.Forwarder,
            provider,
            txDefaults,
            exchangeInstance.address,
            wethContract.address,
            zrxToken.address,
            zrxAssetData,
            wethAssetData,
        );
        forwarderContract = new ForwarderContract(forwarderInstance.abi, forwarderInstance.address, provider);
        forwarderWrapper = new ForwarderWrapper(forwarderContract, provider);
        const zrxDepositAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(10000), 18);
        await web3Wrapper.awaitTransactionSuccessAsync(
            await zrxToken.transfer.sendTransactionAsync(forwarderContract.address, zrxDepositAmount),
        );
        erc20Wrapper.addTokenOwnerAddress(forwarderInstance.address);
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

    describe('marketSellOrdersWithEth without extra fees', () => {
        it('should fill a single order', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const ethValue = orderWithoutFee.takerAssetAmount.dividedToIntegerBy(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getPercentageOfValue(
                ethValue,
                MAX_WETH_FILL_PERCENTAGE,
            );
            const makerAssetFillAmount = primaryTakerAssetFillAmount
                .times(orderWithoutFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithoutFee.takerAssetAmount);
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should fill multiple orders', async () => {
            const secondOrderWithoutFee = await orderFactory.newSignedOrderAsync();
            const ordersWithoutFee = [orderWithoutFee, secondOrderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const ethValue = ordersWithoutFee[0].takerAssetAmount.plus(
                ordersWithoutFee[1].takerAssetAmount.dividedToIntegerBy(2),
            );

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getPercentageOfValue(
                ethValue,
                MAX_WETH_FILL_PERCENTAGE,
            );
            const firstTakerAssetFillAmount = ordersWithoutFee[0].takerAssetAmount;
            const secondTakerAssetFillAmount = primaryTakerAssetFillAmount.minus(firstTakerAssetFillAmount);

            const makerAssetFillAmount = ordersWithoutFee[0].makerAssetAmount.plus(
                ordersWithoutFee[1].makerAssetAmount
                    .times(secondTakerAssetFillAmount)
                    .dividedToIntegerBy(ordersWithoutFee[1].takerAssetAmount),
            );
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should fill the order and pay ZRX fees from a single feeOrder', async () => {
            const ordersWithFee = [orderWithFee];
            const feeOrders = [feeOrder];
            const ethValue = orderWithFee.takerAssetAmount.dividedToIntegerBy(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getPercentageOfValue(
                ethValue,
                MAX_WETH_FILL_PERCENTAGE,
            );
            const makerAssetFillAmount = primaryTakerAssetFillAmount
                .times(orderWithoutFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithoutFee.takerAssetAmount);
            const feeAmount = ForwarderWrapper.getPercentageOfValue(
                orderWithFee.takerFee.dividedToIntegerBy(2),
                MAX_WETH_FILL_PERCENTAGE,
            );
            const wethSpentOnFeeOrders = ForwarderWrapper.getWethForFeeOrders(feeAmount, feeOrders);
            const totalEthSpent = primaryTakerAssetFillAmount
                .plus(wethSpentOnFeeOrders)
                .plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount).plus(wethSpentOnFeeOrders),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should fill the orders and pay ZRX from multiple feeOrders', async () => {
            const ordersWithFee = [orderWithFee];
            const ethValue = orderWithFee.takerAssetAmount;
            const makerAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
            const makerAssetAmount = orderWithFee.takerFee.dividedToIntegerBy(2);
            const takerAssetAmount = feeOrder.takerAssetAmount
                .times(makerAssetAmount)
                .dividedToIntegerBy(feeOrder.makerAssetAmount);

            const firstFeeOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                makerAssetAmount,
                takerAssetAmount,
            });
            const secondFeeOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                makerAssetAmount,
                takerAssetAmount,
            });
            const feeOrders = [firstFeeOrder, secondFeeOrder];

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getPercentageOfValue(
                ethValue,
                MAX_WETH_FILL_PERCENTAGE,
            );
            const makerAssetFillAmount = primaryTakerAssetFillAmount
                .times(orderWithoutFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithoutFee.takerAssetAmount);
            const feeAmount = ForwarderWrapper.getPercentageOfValue(orderWithFee.takerFee, MAX_WETH_FILL_PERCENTAGE);
            const wethSpentOnFeeOrders = ForwarderWrapper.getWethForFeeOrders(feeAmount, feeOrders);
            const totalEthSpent = primaryTakerAssetFillAmount
                .plus(wethSpentOnFeeOrders)
                .plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount).plus(wethSpentOnFeeOrders),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should fill the order when token is ZRX with fees', async () => {
            orderWithFee = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const ordersWithFee = [orderWithFee];
            const feeOrders: SignedOrder[] = [];
            const ethValue = orderWithFee.takerAssetAmount.dividedToIntegerBy(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const makerAssetFillAmount = orderWithFee.makerAssetAmount.dividedToIntegerBy(2);
            const totalEthSpent = ethValue.plus(gasPrice.times(tx.gasUsed));
            const takerFeePaid = orderWithFee.takerFee.dividedToIntegerBy(2);
            const makerFeePaid = orderWithFee.makerFee.dividedToIntegerBy(2);

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerAssetFillAmount).minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].plus(makerAssetFillAmount).minus(takerFeePaid),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(ethValue),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[forwarderContract.address][zrxToken.address],
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should refund remaining ETH if amount is greater than takerAssetAmount', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const ethValue = orderWithoutFee.takerAssetAmount.times(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const totalEthSpent = orderWithoutFee.takerAssetAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        });
        it('should revert if ZRX cannot be fully repurchased', async () => {
            orderWithFee = await orderFactory.newSignedOrderAsync({
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), DECIMALS_DEFAULT),
            });
            const ordersWithFee = [orderWithFee];
            feeOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const feeOrders = [feeOrder];
            const ethValue = orderWithFee.takerAssetAmount;
            return expectTransactionFailedAsync(
                forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithFee, feeOrders, {
                    value: ethValue,
                    from: takerAddress,
                }),
                RevertReason.CompleteFillFailed,
            );
        });
        it('should not fill orders with different makerAssetData than the first order', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            const erc721SignedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
            });
            const erc20SignedOrder = await orderFactory.newSignedOrderAsync();
            const ordersWithoutFee = [erc20SignedOrder, erc721SignedOrder];
            const feeOrders: SignedOrder[] = [];
            const ethValue = erc20SignedOrder.takerAssetAmount.plus(erc721SignedOrder.takerAssetAmount);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const totalEthSpent = erc20SignedOrder.takerAssetAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        });
    });
    describe('marketSellOrdersWithEth with extra fees', () => {
        it('should fill the order and send fee to feeRecipient', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const ethValue = orderWithoutFee.takerAssetAmount.div(2);

            const baseFeePercentage = 2;
            feePercentage = ForwarderWrapper.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, baseFeePercentage);
            const feeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(
                ordersWithoutFee,
                feeOrders,
                {
                    value: ethValue,
                    from: takerAddress,
                },
                { feePercentage, feeRecipient: feeRecipientAddress },
            );
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const feeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getPercentageOfValue(
                ethValue,
                MAX_WETH_FILL_PERCENTAGE,
            );
            const makerAssetFillAmount = primaryTakerAssetFillAmount
                .times(orderWithoutFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithoutFee.takerAssetAmount);
            const ethSpentOnFee = ForwarderWrapper.getPercentageOfValue(primaryTakerAssetFillAmount, baseFeePercentage);
            const totalEthSpent = primaryTakerAssetFillAmount.plus(ethSpentOnFee).plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(feeRecipientEthBalanceAfter).to.be.bignumber.equal(feeRecipientEthBalanceBefore.plus(ethSpentOnFee));
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should fail if the fee is set too high', async () => {
            const ethValue = orderWithoutFee.takerAssetAmount.div(2);
            const baseFeePercentage = 6;
            feePercentage = ForwarderWrapper.getPercentageOfValue(ethValue, baseFeePercentage);
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            await expectTransactionFailedAsync(
                forwarderWrapper.marketSellOrdersWithEthAsync(
                    ordersWithoutFee,
                    feeOrders,
                    { from: takerAddress, value: ethValue, gasPrice },
                    { feePercentage, feeRecipient: feeRecipientAddress },
                ),
                RevertReason.FeePercentageTooLarge,
            );
        });
        it('should fail if there is not enough ETH remaining to pay the fee', async () => {
            const ethValue = orderWithoutFee.takerAssetAmount.div(2);
            const baseFeePercentage = 5;
            feePercentage = ForwarderWrapper.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, baseFeePercentage);
            const ordersWithFee = [orderWithFee];
            const feeOrders = [feeOrder];
            await expectTransactionFailedAsync(
                forwarderWrapper.marketSellOrdersWithEthAsync(
                    ordersWithFee,
                    feeOrders,
                    { from: takerAddress, value: ethValue, gasPrice },
                    { feePercentage, feeRecipient: feeRecipientAddress },
                ),
                RevertReason.InsufficientEthRemaining,
            );
        });
    });
    describe('marketBuyOrdersWithEth without extra fees', () => {
        it('should buy the exact amount of makerAsset in a single order', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount.dividedToIntegerBy(2);

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should buy the exact amount of makerAsset in multiple orders', async () => {
            const secondOrderWithoutFee = await orderFactory.newSignedOrderAsync();
            const ordersWithoutFee = [orderWithoutFee, secondOrderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = ordersWithoutFee[0].makerAssetAmount.plus(
                ordersWithoutFee[1].makerAssetAmount.dividedToIntegerBy(2),
            );
            const ethValue = ordersWithoutFee[0].takerAssetAmount.plus(
                ordersWithoutFee[1].takerAssetAmount.dividedToIntegerBy(2),
            );

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should buy the exact amount of makerAsset and return excess ETH', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount;

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue.dividedToIntegerBy(2);
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should buy the exact amount of makerAsset and pay ZRX from feeOrders', async () => {
            const ordersWithFee = [orderWithFee];
            const feeOrders = [feeOrder];
            const makerAssetFillAmount = orderWithFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithFee.takerAssetAmount;

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = orderWithFee.takerAssetAmount.dividedToIntegerBy(2);
            const feeAmount = orderWithFee.takerFee.dividedToIntegerBy(2);
            const wethSpentOnFeeOrders = ForwarderWrapper.getWethForFeeOrders(feeAmount, feeOrders);
            const totalEthSpent = primaryTakerAssetFillAmount
                .plus(wethSpentOnFeeOrders)
                .plus(gasPrice.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount).plus(wethSpentOnFeeOrders),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should buy slightly greater than makerAssetAmount when buying ZRX', async () => {
            orderWithFee = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const ordersWithFee = [orderWithFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithFee.takerAssetAmount;
            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ForwarderWrapper.getWethForFeeOrders(
                makerAssetFillAmount,
                ordersWithFee,
            );
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));
            const makerAssetFilledAmount = orderWithFee.makerAssetAmount
                .times(primaryTakerAssetFillAmount)
                .dividedToIntegerBy(orderWithFee.takerAssetAmount);
            const takerFeePaid = orderWithFee.takerFee
                .times(primaryTakerAssetFillAmount)
                .dividedToIntegerBy(orderWithFee.takerAssetAmount);
            const makerFeePaid = orderWithFee.makerFee
                .times(primaryTakerAssetFillAmount)
                .dividedToIntegerBy(orderWithFee.takerAssetAmount);
            const totalZrxPurchased = makerAssetFilledAmount.minus(takerFeePaid);
            // Up to 1 wei worth of ZRX will be overbought per order
            const maxOverboughtZrx = new BigNumber(1)
                .times(orderWithFee.makerAssetAmount)
                .dividedToIntegerBy(orderWithFee.takerAssetAmount);

            expect(totalZrxPurchased).to.be.bignumber.gte(makerAssetFillAmount);
            expect(totalZrxPurchased).to.be.bignumber.lte(makerAssetFillAmount.plus(maxOverboughtZrx));
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerAssetFilledAmount).minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].plus(totalZrxPurchased),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[forwarderContract.address][zrxToken.address],
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should not change balances if the amount of ETH sent is too low to fill the makerAssetAmount', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount.dividedToIntegerBy(4);

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const totalEthSpent = gasPrice.times(tx.gasUsed);

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances).to.deep.equal(erc20Balances);
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should buy an ERC721 asset from a single order', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            orderWithoutFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
            });
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = new BigNumber(1);
            const ethValue = orderWithFee.takerAssetAmount;

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                from: takerAddress,
                value: ethValue,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newOwner = await erc721Token.ownerOf.callAsync(makerAssetId);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));
            expect(newOwner).to.be.bignumber.equal(takerAddress);
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should buy an ERC721 asset and ignore later orders with different makerAssetData', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            orderWithoutFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
            });
            const differentMakerAssetDataOrder = await orderFactory.newSignedOrderAsync();
            const ordersWithoutFee = [orderWithoutFee, differentMakerAssetDataOrder];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = new BigNumber(1).plus(differentMakerAssetDataOrder.makerAssetAmount);
            const ethValue = orderWithFee.takerAssetAmount;

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithoutFee, feeOrders, makerAssetFillAmount, {
                from: takerAddress,
                value: ethValue,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newOwner = await erc721Token.ownerOf.callAsync(makerAssetId);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = ethValue;
            const totalEthSpent = primaryTakerAssetFillAmount.plus(gasPrice.times(tx.gasUsed));
            expect(newOwner).to.be.bignumber.equal(takerAddress);
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress],
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress],
            );
        });
        it('should buy an ERC721 asset and pay ZRX fees from a single fee order', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            orderWithFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const ordersWithFee = [orderWithFee];
            const feeOrders = [feeOrder];
            const makerAssetFillAmount = orderWithFee.makerAssetAmount;
            const primaryTakerAssetFillAmount = orderWithFee.takerAssetAmount;
            const feeAmount = orderWithFee.takerFee;
            const wethSpentOnFeeOrders = ForwarderWrapper.getWethForFeeOrders(feeAmount, feeOrders);
            const ethValue = primaryTakerAssetFillAmount.plus(wethSpentOnFeeOrders);

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newOwner = await erc721Token.ownerOf.callAsync(makerAssetId);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const totalEthSpent = ethValue.plus(gasPrice.times(tx.gasUsed));

            expect(newOwner).to.be.bignumber.equal(takerAddress);
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount).plus(wethSpentOnFeeOrders),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should buy an ERC721 asset and pay ZRX fees from multiple fee orders', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            orderWithFee = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            const ordersWithFee = [orderWithFee];
            const makerAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
            const makerAssetAmount = orderWithFee.takerFee.dividedToIntegerBy(2);
            const takerAssetAmount = feeOrder.takerAssetAmount
                .times(makerAssetAmount)
                .dividedToIntegerBy(feeOrder.makerAssetAmount);

            const firstFeeOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                makerAssetAmount,
                takerAssetAmount,
            });
            const secondFeeOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
                makerAssetAmount,
                takerAssetAmount,
            });
            const feeOrders = [firstFeeOrder, secondFeeOrder];

            const makerAssetFillAmount = orderWithFee.makerAssetAmount;
            const primaryTakerAssetFillAmount = orderWithFee.takerAssetAmount;
            const feeAmount = orderWithFee.takerFee;
            const wethSpentOnFeeOrders = ForwarderWrapper.getWethForFeeOrders(feeAmount, feeOrders);
            const ethValue = primaryTakerAssetFillAmount.plus(wethSpentOnFeeOrders);

            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithFee, feeOrders, makerAssetFillAmount, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newOwner = await erc721Token.ownerOf.callAsync(makerAssetId);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const totalEthSpent = ethValue.plus(gasPrice.times(tx.gasUsed));

            expect(newOwner).to.be.bignumber.equal(takerAddress);
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount).plus(wethSpentOnFeeOrders),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
    });
    describe('marketBuyOrdersWithEth with extra fees', () => {
        it('should buy an asset and send fee to feeRecipient', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount;

            const baseFeePercentage = 2;
            feePercentage = ForwarderWrapper.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, baseFeePercentage);
            const feeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(
                ordersWithoutFee,
                feeOrders,
                makerAssetFillAmount,
                {
                    value: ethValue,
                    from: takerAddress,
                },
                { feePercentage, feeRecipient: feeRecipientAddress },
            );
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const feeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const primaryTakerAssetFillAmount = orderWithoutFee.takerAssetAmount.dividedToIntegerBy(2);
            const ethSpentOnFee = ForwarderWrapper.getPercentageOfValue(primaryTakerAssetFillAmount, baseFeePercentage);
            const totalEthSpent = primaryTakerAssetFillAmount.plus(ethSpentOnFee).plus(gasPrice.times(tx.gasUsed));

            expect(feeRecipientEthBalanceAfter).to.be.bignumber.equal(feeRecipientEthBalanceBefore.plus(ethSpentOnFee));
            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[makerAddress][weth.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][weth.address].plus(primaryTakerAssetFillAmount),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(constants.ZERO_AMOUNT);
            expect(newBalances[forwarderContract.address][defaultMakerAssetAddress]).to.be.bignumber.equal(
                constants.ZERO_AMOUNT,
            );
            expect(forwarderEthBalance).to.be.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should fail if the fee is set too high', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount;

            const baseFeePercentage = 6;
            feePercentage = ForwarderWrapper.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, baseFeePercentage);
            await expectTransactionFailedAsync(
                forwarderWrapper.marketBuyOrdersWithEthAsync(
                    ordersWithoutFee,
                    feeOrders,
                    makerAssetFillAmount,
                    {
                        value: ethValue,
                        from: takerAddress,
                    },
                    { feePercentage, feeRecipient: feeRecipientAddress },
                ),
                RevertReason.FeePercentageTooLarge,
            );
        });
        it('should fail if there is not enough ETH remaining to pay the fee', async () => {
            const ordersWithoutFee = [orderWithoutFee];
            const feeOrders: SignedOrder[] = [];
            const makerAssetFillAmount = orderWithoutFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount.dividedToIntegerBy(2);

            const baseFeePercentage = 2;
            feePercentage = ForwarderWrapper.getPercentageOfValue(constants.PERCENTAGE_DENOMINATOR, baseFeePercentage);
            await expectTransactionFailedAsync(
                forwarderWrapper.marketBuyOrdersWithEthAsync(
                    ordersWithoutFee,
                    feeOrders,
                    makerAssetFillAmount,
                    {
                        value: ethValue,
                        from: takerAddress,
                    },
                    { feePercentage, feeRecipient: feeRecipientAddress },
                ),
                RevertReason.InsufficientEthRemaining,
            );
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
