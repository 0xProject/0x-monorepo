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
import { formatters } from '../utils/formatters';
import { ForwarderWrapper } from '../utils/forwarder_wrapper';
import { OrderFactory } from '../utils/order_factory';
import { ContractName, ERC20BalancesByOwner } from '../utils/types';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const DECIMALS_DEFAULT = 18;
// Set a gasPrice so when checking balance of msg.sender we can accurately calculate gasPrice*gasUsed
const DEFAULT_GAS_PRICE = new BigNumber(1);

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
    let ordersWithoutFee: SignedOrder[];
    let orderWithFee: SignedOrder;
    let ordersWithFee: SignedOrder[];
    let feeOrder: SignedOrder;
    let feeOrders: SignedOrder[];
    let orderFactory: OrderFactory;
    let erc20Wrapper: ERC20Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let tx: TransactionReceiptWithDecodedLogs;

    let erc721MakerAssetIds: BigNumber[];
    let takerEthBalanceBefore: BigNumber;
    let feePercentage: BigNumber;
    const MAX_WETH_FILL_PERCENTAGE = 95;

    before(async () => {
        await blockchainLifecycle.startAsync();
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress, otherAddress] = accounts);

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

        web3Wrapper.abiDecoder.addABI(forwarderContract.abi);
        web3Wrapper.abiDecoder.addABI(exchangeInstance.abi);
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
        it('should fill the order', async () => {
            ordersWithoutFee = [orderWithoutFee];
            feeOrders = [];
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
            const totalEthSpent = primaryTakerAssetFillAmount.plus(DEFAULT_GAS_PRICE.times(tx.gasUsed));

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
        it('should fill the order and pay ZRX fees from feeOrders', async () => {
            ordersWithFee = [orderWithFee];
            feeOrders = [feeOrder];
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
                .plus(DEFAULT_GAS_PRICE.times(tx.gasUsed));

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
            ordersWithFee = [orderWithFee];
            feeOrders = [];
            const ethValue = orderWithFee.takerAssetAmount.dividedToIntegerBy(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const forwarderEthBalance = await web3Wrapper.getBalanceInWeiAsync(forwarderContract.address);
            const newBalances = await erc20Wrapper.getBalancesAsync();

            const makerAssetFillAmount = orderWithFee.makerAssetAmount.dividedToIntegerBy(2);
            const totalEthSpent = ethValue.plus(DEFAULT_GAS_PRICE.times(tx.gasUsed));
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
            ordersWithoutFee = [orderWithoutFee];
            const ethValue = orderWithoutFee.takerAssetAmount.times(2);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const totalEthSpent = orderWithoutFee.takerAssetAmount.plus(DEFAULT_GAS_PRICE.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        });
        it('should revert if ZRX cannot be fully repurchased', async () => {
            orderWithFee = await orderFactory.newSignedOrderAsync({
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(50), DECIMALS_DEFAULT),
            });
            ordersWithFee = [orderWithFee];
            feeOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            feeOrders = [feeOrder];
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
            ordersWithoutFee = [erc20SignedOrder, erc721SignedOrder];
            const ethValue = erc20SignedOrder.takerAssetAmount.plus(erc721SignedOrder.takerAssetAmount);

            tx = await forwarderWrapper.marketSellOrdersWithEthAsync(ordersWithoutFee, feeOrders, {
                value: ethValue,
                from: takerAddress,
            });
            const takerEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const totalEthSpent = erc20SignedOrder.takerAssetAmount.plus(DEFAULT_GAS_PRICE.times(tx.gasUsed));

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
        });
    });
    describe('marketSellOrdersWithEth with extra fees', () => {
        it('should fill the order and send fee to feeRecipient', async () => {
            ordersWithoutFee = [orderWithoutFee];
            feeOrders = [];
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
            const totalEthSpent = primaryTakerAssetFillAmount
                .plus(ethSpentOnFee)
                .plus(DEFAULT_GAS_PRICE.times(tx.gasUsed));

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
            const feeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const ethValue = orderWithoutFee.takerAssetAmount.div(2);
            const baseFeePercentage = 6;
            feePercentage = ForwarderWrapper.getPercentageOfValue(ethValue, baseFeePercentage);
            feeOrders = [];
            await expectTransactionFailedAsync(
                forwarderWrapper.marketSellOrdersWithEthAsync(
                    ordersWithoutFee,
                    feeOrders,
                    { from: takerAddress, value: ethValue, gasPrice: DEFAULT_GAS_PRICE },
                    { feePercentage, feeRecipient: feeRecipientAddress },
                ),
                RevertReason.FeePercentageTooLarge,
            );
            const feeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            expect(feeRecipientEthBalanceAfter).to.be.bignumber.equal(feeRecipientEthBalanceBefore);
        });
    });
    describe('marketBuyOrdersWithEth without extra fees', () => {
        it('should buy the exact amount of assets', async () => {
            ordersWithoutFee = [orderWithoutFee];
            feeOrders = [];
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
            const totalEthSpent = primaryTakerAssetFillAmount.plus(DEFAULT_GAS_PRICE.times(tx.gasUsed));

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
        it('should buy the exact amount of assets and return excess ETH', async () => {
            ordersWithoutFee = [orderWithoutFee];
            feeOrders = [];
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
            const totalEthSpent = primaryTakerAssetFillAmount.plus(DEFAULT_GAS_PRICE.times(tx.gasUsed));

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
        it('should buy the exact amount of assets with fee abstraction', async () => {
            ordersWithFee = [orderWithFee];
            feeOrders = [feeOrder];
            const makerAssetFillAmount = orderWithFee.makerAssetAmount.dividedToIntegerBy(2);
            const ethValue = orderWithoutFee.takerAssetAmount;

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
                .plus(DEFAULT_GAS_PRICE.times(tx.gasUsed));

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
        it('should buy the exact amount of assets when buying ZRX with fee abstraction', async () => {
            orderWithFee = await orderFactory.newSignedOrderAsync({
                makerAssetData: assetProxyUtils.encodeERC20AssetData(zrxToken.address),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            ordersWithFee = [orderWithFee];
            feeOrders = [];
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
            const totalEthSpent = primaryTakerAssetFillAmount.plus(DEFAULT_GAS_PRICE.times(tx.gasUsed));
            const makerAssetFilledAmount = orderWithFee.makerAssetAmount
                .times(primaryTakerAssetFillAmount)
                .dividedToIntegerBy(orderWithFee.takerAssetAmount);
            const takerFeePaid = orderWithFee.takerFee
                .times(primaryTakerAssetFillAmount)
                .dividedToIntegerBy(orderWithFee.takerAssetAmount);
            const makerFeePaid = orderWithFee.makerFee
                .times(primaryTakerAssetFillAmount)
                .dividedToIntegerBy(orderWithFee.takerAssetAmount);

            expect(takerEthBalanceAfter).to.be.bignumber.equal(takerEthBalanceBefore.minus(totalEthSpent));
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerAssetFilledAmount).minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].plus(makerAssetFilledAmount).minus(takerFeePaid),
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
        // it('throws if fees are higher than 5% when buying zrx', async () => {
        //     const highFeeZRXOrder = orderFactory.newSignedOrder({
        //         makerAssetData: assetProxyUtils.encodeERC20AssetData(zrxToken.address),
        //         makerAssetAmount: orderWithoutFee.makerAssetAmount,
        //         takerFee: orderWithoutFee.makerAssetAmount.times(0.06),
        //     });
        //     ordersWithFee = [highFeeZRXOrder];
        //     feeOrders = [];
        //     const makerAssetAmount = orderWithoutFee.makerAssetAmount.div(2);
        //     const fillAmountWei = await forwarderWrapper.calculateMarketBuyFillAmountWeiAsync(
        //         ordersWithFee,
        //         feeOrders,
        //         feePercentage,
        //         makerAssetAmount,
        //     );
        //     return expectTransactionFailedAsync(
        //         forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithFee, feeOrders, makerAssetAmount, {
        //             from: takerAddress,
        //             value: fillAmountWei,
        //         }),
        //         RevertReason.UnacceptableThreshold,
        //     );
        // });
        // it('throws if fees are higher than 5% when buying erc20', async () => {
        //     const highFeeERC20Order = orderFactory.newSignedOrder({
        //         takerFee: orderWithoutFee.makerAssetAmount.times(0.06),
        //     });
        //     ordersWithFee = [highFeeERC20Order];
        //     feeOrders = [feeOrder];
        //     const makerAssetAmount = orderWithoutFee.makerAssetAmount.div(2);
        //     const fillAmountWei = await forwarderWrapper.calculateMarketBuyFillAmountWeiAsync(
        //         ordersWithFee,
        //         feeOrders,
        //         feePercentage,
        //         makerAssetAmount,
        //     );
        //     return expectTransactionFailedAsync(
        //         forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithFee, feeOrders, makerAssetAmount, {
        //             from: takerAddress,
        //             value: fillAmountWei,
        //         }),
        //         RevertReason.UnacceptableThreshold as any,
        //     );
        // });
        // it('throws if makerAssetAmount is 0', async () => {
        //     const makerAssetAmount = new BigNumber(0);
        //     const fillAmountWei = await forwarderWrapper.calculateMarketBuyFillAmountWeiAsync(
        //         ordersWithFee,
        //         feeOrders,
        //         feePercentage,
        //         makerAssetAmount,
        //     );
        //     return expectTransactionFailedAsync(
        //         forwarderWrapper.marketBuyOrdersWithEthAsync(ordersWithFee, feeOrders, makerAssetAmount, {
        //             from: takerAddress,
        //             value: fillAmountWei,
        //         }),
        //         RevertReason.ValueGreaterThanZero as any,
        //     );
        // });
        // it('throws if the amount of ETH sent in is less than the takerAssetFilledAmount', async () => {
        //     const makerAssetAmount = orderWithoutFee.makerAssetAmount;
        //     const primaryTakerAssetFillAmount = orderWithoutFee.takerAssetAmount.div(2);
        //     const zero = new BigNumber(0);
        //     // Deposit enough taker balance to fill the order
        //     const wethDepositTxHash = await wethContract.deposit.sendTransactionAsync({
        //         from: takerAddress,
        //         value: orderWithoutFee.takerAssetAmount,
        //     });
        //     await web3Wrapper.awaitTransactionSuccessAsync(wethDepositTxHash);
        //     // Transfer all of this WETH to the forwarding contract
        //     const wethTransferTxHash = await wethContract.transfer.sendTransactionAsync(
        //         forwarderContract.address,
        //         orderWithoutFee.takerAssetAmount,
        //         { from: takerAddress },
        //     );
        //     await web3Wrapper.awaitTransactionSuccessAsync(wethTransferTxHash);
        //     // We use the contract directly to get around wrapper validations and calculations
        //     const formattedOrders = formatters.createMarketSellOrders(signedOrders, zero);
        //     const formattedFeeOrders = formatters.createMarketSellOrders(feeOrders, zero);
        //     return expectTransactionFailedAsync(
        //         forwarderContract.marketBuyOrdersWithEth.sendTransactionAsync(
        //             formattedOrders.orders,
        //             formattedOrders.signatures,
        //             formattedFeeOrders.orders,
        //             formattedFeeOrders.signatures,
        //             makerAssetAmount,
        //             zero,
        //             constants.NULL_ADDRESS,
        //             { value: primaryTakerAssetFillAmount, from: takerAddress },
        //         ),
        //         RevertReason.InvalidMsgValue,
        //     );
        // });
    });
    // describe('marketBuyOrdersWithEth - ERC721', async () => {
    //     it('buys ERC721 assets', async () => {
    //         const makerAssetId = erc721MakerAssetIds[0];
    //         orderWithoutFee = orderFactory.newSignedOrder({
    //             makerAssetAmount: new BigNumber(1),
    //             makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
    //         });
    //         feeOrders = [];
    //         signedOrders = [orderWithoutFee];
    //         const makerAssetAmount = new BigNumber(signedOrders.length);
    //         const fillAmountWei = await forwarderWrapper.calculateMarketBuyFillAmountWeiAsync(
    //             signedOrders,
    //             feeOrders,
    //             feePercentage,
    //             makerAssetAmount,
    //         );
    //         tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(signedOrders, feeOrders, makerAssetAmount, {
    //             from: takerAddress,
    //             value: fillAmountWei,
    //         });
    //         const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
    //         expect(newOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
    //     });
    //     it('buys ERC721 assets with fee abstraction', async () => {
    //         const makerAssetId = erc721MakerAssetIds[0];
    //         orderWithoutFee = orderFactory.newSignedOrder({
    //             makerAssetAmount: new BigNumber(1),
    //             takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
    //             makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
    //         });
    //         signedOrders = [orderWithoutFee];
    //         const makerAssetAmount = new BigNumber(signedOrders.length);
    //         const fillAmountWei = await forwarderWrapper.calculateMarketBuyFillAmountWeiAsync(
    //             signedOrders,
    //             feeOrders,
    //             feePercentage,
    //             makerAssetAmount,
    //         );
    //         tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(signedOrders, feeOrders, makerAssetAmount, {
    //             from: takerAddress,
    //             value: fillAmountWei,
    //         });
    //         const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
    //         expect(newOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
    //     });
    //     it('buys ERC721 assets with fee abstraction and pays fee to fee recipient', async () => {
    //         const makerAssetId = erc721MakerAssetIds[0];
    //         orderWithoutFee = orderFactory.newSignedOrder({
    //             makerAssetAmount: new BigNumber(1),
    //             takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
    //             makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
    //         });
    //         signedOrders = [orderWithoutFee];
    //         feePercentage = 100;
    //         const initTakerBalanceWei = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
    //         const initFeeRecipientBalanceWei = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
    //         const makerAssetAmount = new BigNumber(signedOrders.length);
    //         const fillAmountWei = await forwarderWrapper.calculateMarketBuyFillAmountWeiAsync(
    //             signedOrders,
    //             feeOrders,
    //             feePercentage,
    //             makerAssetAmount,
    //         );
    //         tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(
    //             signedOrders,
    //             feeOrders,
    //             makerAssetAmount,
    //             {
    //                 from: takerAddress,
    //                 value: fillAmountWei,
    //                 gasPrice: DEFAULT_GAS_PRICE,
    //             },
    //             {
    //                 feePercentage,
    //                 feeRecipient: feeRecipientAddress,
    //             },
    //         );
    //         const afterFeeRecipientEthBalance = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
    //         const afterTakerBalanceWei = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
    //         const takerFilledAmount = initTakerBalanceWei.minus(afterTakerBalanceWei).plus(tx.gasUsed);
    //         const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
    //         expect(newOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
    //         const balanceDiff = afterFeeRecipientEthBalance.minus(initFeeRecipientBalanceWei);
    //         expect(takerFilledAmount.dividedToIntegerBy(balanceDiff)).to.be.bignumber.equal(101);
    //         expect(takerFilledAmount.minus(balanceDiff).dividedToIntegerBy(balanceDiff)).to.be.bignumber.equal(100);
    //     });
    //     it('buys multiple ERC721 assets with fee abstraction and pays fee to fee recipient', async () => {
    //         const makerAssetId1 = erc721MakerAssetIds[0];
    //         const makerAssetId2 = erc721MakerAssetIds[1];
    //         const signedOrder1 = orderFactory.newSignedOrder({
    //             makerAssetAmount: new BigNumber(1),
    //             takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(3), DECIMALS_DEFAULT),
    //             makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId1),
    //         });
    //         const signedOrder2 = orderFactory.newSignedOrder({
    //             makerAssetAmount: new BigNumber(1),
    //             takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(4), DECIMALS_DEFAULT),
    //             makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId2),
    //         });
    //         signedOrders = [signedOrder1, signedOrder2];
    //         feePercentage = 10;
    //         const makerAssetAmount = new BigNumber(signedOrders.length);
    //         const fillAmountWei = await forwarderWrapper.calculateMarketBuyFillAmountWeiAsync(
    //             signedOrders,
    //             feeOrders,
    //             feePercentage,
    //             makerAssetAmount,
    //         );
    //         tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(signedOrders, feeOrders, makerAssetAmount, {
    //             from: takerAddress,
    //             value: fillAmountWei,
    //         });
    //         const newOwnerTakerAsset1 = await erc721Token.ownerOf.callAsync(makerAssetId1);
    //         expect(newOwnerTakerAsset1).to.be.bignumber.equal(takerAddress);
    //         const newOwnerTakerAsset2 = await erc721Token.ownerOf.callAsync(makerAssetId2);
    //         expect(newOwnerTakerAsset2).to.be.bignumber.equal(takerAddress);
    //     });
    //     it('buys ERC721 assets with fee abstraction and handles fee orders filled and excess eth', async () => {
    //         const makerAssetId = erc721MakerAssetIds[0];
    //         feePercentage = 0;
    //         // In this scenario a total of 6 ZRX fees need to be paid.
    //         // There are two fee orders, but the first fee order is partially filled while
    //         // the Forwarding contract tx is in the mempool.
    //         const erc721MakerAssetAmount = new BigNumber(1);
    //         orderWithoutFee = orderFactory.newSignedOrder({
    //             makerAssetAmount: erc721MakerAssetAmount,
    //             takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), DECIMALS_DEFAULT),
    //             takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(6), DECIMALS_DEFAULT),
    //             makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
    //         });
    //         signedOrders = [orderWithoutFee];
    //         const firstFeeOrder = orderFactory.newSignedOrder({
    //             makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(8), DECIMALS_DEFAULT),
    //             takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(0.1), DECIMALS_DEFAULT),
    //             makerAssetData: assetProxyUtils.encodeERC20AssetData(zrxToken.address),
    //             takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
    //         });
    //         const secondFeeOrder = orderFactory.newSignedOrder({
    //             makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(8), DECIMALS_DEFAULT),
    //             takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(0.12), DECIMALS_DEFAULT),
    //             makerAssetData: assetProxyUtils.encodeERC20AssetData(zrxToken.address),
    //             takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
    //         });
    //         feeOrders = [firstFeeOrder, secondFeeOrder];
    //         const makerAssetAmount = new BigNumber(signedOrders.length);
    //         const fillAmountWei = await forwarderWrapper.calculateMarketBuyFillAmountWeiAsync(
    //             signedOrders,
    //             feeOrders,
    //             feePercentage,
    //             erc721MakerAssetAmount,
    //         );
    //         // Simulate another otherAddress user partially filling firstFeeOrder
    //         const firstFeeOrderFillAmount = firstFeeOrder.makerAssetAmount.div(2);
    //         tx = await forwarderWrapper.marketBuyOrdersWithEthAsync([firstFeeOrder], [], firstFeeOrderFillAmount, {
    //             from: otherAddress,
    //             value: fillAmountWei,
    //         });
    //         // For tests we calculate how much this should've cost given that firstFeeOrder was filled
    //         const expectedFillAmountWei = await forwarderWrapper.calculateMarketBuyFillAmountWeiAsync(
    //             signedOrders,
    //             feeOrders,
    //             feePercentage,
    //             erc721MakerAssetAmount,
    //         );
    //         // With 4 ZRX remaining in firstFeeOrder, the secondFeeOrder will need to be filled to make up
    //         // the total amount of fees required (6)
    //         // Since the fee orders can be filled while the transaction is pending the user safely sends in
    //         // extra ether to cover any slippage
    //         const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
    //         const slippageFillAmountWei = fillAmountWei.times(2);
    //         tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(signedOrders, feeOrders, makerAssetAmount, {
    //             from: takerAddress,
    //             value: slippageFillAmountWei,
    //             gasPrice: DEFAULT_GAS_PRICE,
    //         });
    //         const afterEthBalance = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
    //         const expectedEthBalanceAfterGasCosts = initEthBalance.minus(expectedFillAmountWei).minus(tx.gasUsed);
    //         const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
    //         expect(newOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
    //         expect(afterEthBalance).to.be.bignumber.equal(expectedEthBalanceAfterGasCosts);
    //     });
    //     it('buys ERC721 assets with fee abstraction and handles fee orders filled', async () => {
    //         const makerAssetId = erc721MakerAssetIds[0];
    //         feePercentage = 0;
    //         // In this scenario a total of 6 ZRX fees need to be paid.
    //         // There are two fee orders, but the first fee order is partially filled while
    //         // the Forwarding contract tx is in the mempool.
    //         const erc721MakerAssetAmount = new BigNumber(1);
    //         orderWithoutFee = orderFactory.newSignedOrder({
    //             makerAssetAmount: erc721MakerAssetAmount,
    //             takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), DECIMALS_DEFAULT),
    //             takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(6), DECIMALS_DEFAULT),
    //             makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
    //         });
    //         const zrxMakerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(8), DECIMALS_DEFAULT);
    //         signedOrders = [orderWithoutFee];
    //         const firstFeeOrder = orderFactory.newSignedOrder({
    //             makerAssetAmount: zrxMakerAssetAmount,
    //             takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(0.1), DECIMALS_DEFAULT),
    //             makerAssetData: assetProxyUtils.encodeERC20AssetData(zrxToken.address),
    //             takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
    //         });
    //         const secondFeeOrder = orderFactory.newSignedOrder({
    //             makerAssetAmount: zrxMakerAssetAmount,
    //             takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(0.12), DECIMALS_DEFAULT),
    //             makerAssetData: assetProxyUtils.encodeERC20AssetData(zrxToken.address),
    //             takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
    //         });
    //         feeOrders = [firstFeeOrder, secondFeeOrder];
    //         const makerAssetAmount = new BigNumber(signedOrders.length);
    //         const fillAmountWei = await forwarderWrapper.calculateMarketBuyFillAmountWeiAsync(
    //             signedOrders,
    //             feeOrders,
    //             feePercentage,
    //             erc721MakerAssetAmount,
    //         );
    //         // Simulate another otherAddress user partially filling firstFeeOrder
    //         const firstFeeOrderFillAmount = firstFeeOrder.makerAssetAmount.div(2);
    //         tx = await forwarderWrapper.marketBuyOrdersWithEthAsync([firstFeeOrder], [], firstFeeOrderFillAmount, {
    //             from: otherAddress,
    //             value: fillAmountWei,
    //         });
    //         const expectedFillAmountWei = await forwarderWrapper.calculateMarketBuyFillAmountWeiAsync(
    //             signedOrders,
    //             feeOrders,
    //             feePercentage,
    //             erc721MakerAssetAmount,
    //         );
    //         tx = await forwarderWrapper.marketBuyOrdersWithEthAsync(signedOrders, feeOrders, makerAssetAmount, {
    //             from: takerAddress,
    //             value: expectedFillAmountWei,
    //         });
    //         const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
    //         expect(newOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
    //     });
    //     it('throws when mixed ERC721 and ERC20 assets', async () => {
    //         const makerAssetId = erc721MakerAssetIds[0];
    //         const erc721SignedOrder = orderFactory.newSignedOrder({
    //             makerAssetAmount: new BigNumber(1),
    //             makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
    //         });
    //         const erc20SignedOrder = orderFactory.newSignedOrder();
    //         signedOrders = [erc721SignedOrder, erc20SignedOrder];
    //         const makerAssetAmount = new BigNumber(signedOrders.length);
    //         const fillAmountWei = erc20SignedOrder.takerAssetAmount.plus(erc721SignedOrder.takerAssetAmount);
    //         return expectTransactionFailedAsync(
    //             forwarderWrapper.marketBuyOrdersWithEthAsync(signedOrders, feeOrders, makerAssetAmount, {
    //                 from: takerAddress,
    //                 value: fillAmountWei,
    //             }),
    //             RevertReason.LibBytesGreaterOrEqualTo32LengthRequired,
    //         );
    //     });
    //     it('throws when mixed ERC721 and ERC20 assets with ERC20 first', async () => {
    //         const makerAssetId = erc721MakerAssetIds[0];
    //         const erc721SignedOrder = orderFactory.newSignedOrder({
    //             makerAssetAmount: new BigNumber(1),
    //             makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
    //         });
    //         const erc20SignedOrder = orderFactory.newSignedOrder();
    //         signedOrders = [erc20SignedOrder, erc721SignedOrder];
    //         const makerAssetAmount = new BigNumber(signedOrders.length);
    //         const fillAmountWei = erc20SignedOrder.takerAssetAmount.plus(erc721SignedOrder.takerAssetAmount);
    //         return expectTransactionFailedAsync(
    //             forwarderWrapper.marketBuyOrdersWithEthAsync(signedOrders, feeOrders, makerAssetAmount, {
    //                 from: takerAddress,
    //                 value: fillAmountWei,
    //             }),
    //             RevertReason.InvalidTakerAmount,
    //         );
    //     });
    // });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
