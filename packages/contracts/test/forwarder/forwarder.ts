import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { DummyERC20TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c20_token';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import { ExchangeContract } from '../../src/contract_wrappers/generated/exchange';
import { ForwarderContract } from '../../src/contract_wrappers/generated/forwarder';
import { WETH9Contract } from '../../src/contract_wrappers/generated/weth9';
import { artifacts } from '../../src/utils/artifacts';
import { assetProxyUtils } from '../../src/utils/asset_proxy_utils';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { ERC20Wrapper } from '../../src/utils/erc20_wrapper';
import { ERC721Wrapper } from '../../src/utils/erc721_wrapper';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { ForwarderWrapper } from '../../src/utils/forwarder_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { AssetProxyId, ContractName, ERC20BalancesByOwner } from '../../src/utils/types';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const DECIMALS_DEFAULT = 18;

describe(ContractName.Forwarder, () => {
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;
    let defaultTakerAssetAddress: string;
    let defaultMakerAssetAddress: string;
    const INITIAL_BALANCE = Web3Wrapper.toBaseUnitAmount(new BigNumber(10000), DECIMALS_DEFAULT);
    const INITIAL_ALLOWANCE = Web3Wrapper.toBaseUnitAmount(new BigNumber(10000), DECIMALS_DEFAULT);

    let weth: DummyERC20TokenContract;
    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let forwarderContract: ForwarderContract;
    let forwarderWrapper: ForwarderWrapper;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let signedOrder: SignedOrder;
    let signedOrders: SignedOrder[];
    let orderWithFee: SignedOrder;
    let signedOrdersWithFee: SignedOrder[];
    let feeOrder: SignedOrder;
    let feeOrders: SignedOrder[];
    let orderFactory: OrderFactory;
    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let tx: TransactionReceiptWithDecodedLogs;

    let erc721MakerAssetIds: BigNumber[];
    let feeProportion: number = 0;

    before(async () => {
        await blockchainLifecycle.startAsync();
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = accounts);

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync();
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerAssetIds = erc721Balances[makerAddress][erc721Token.address];

        const etherTokenInstance = await WETH9Contract.deployFrom0xArtifactAsync(
            artifacts.EtherToken,
            provider,
            txDefaults,
        );
        weth = new DummyERC20TokenContract(etherTokenInstance.abi, etherTokenInstance.address, provider);
        erc20Wrapper.addDummyTokenContract(weth);

        const exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            assetProxyUtils.encodeERC20ProxyData(zrxToken.address),
        );
        const exchange = new ExchangeContract(exchangeInstance.abi, exchangeInstance.address, provider);
        const exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC20, erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC721, erc721Proxy.address, owner);

        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: owner,
        });
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: owner,
        });

        defaultMakerAssetAddress = erc20TokenA.address;
        defaultTakerAssetAddress = etherTokenInstance.address;
        const defaultOrderParams = {
            exchangeAddress: exchangeInstance.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultMakerAssetAddress),
            takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultTakerAssetAddress),
            makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), DECIMALS_DEFAULT),
            takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), DECIMALS_DEFAULT),
            makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), DECIMALS_DEFAULT),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);

        const forwarderArgs = [
            exchangeInstance.address,
            etherTokenInstance.address,
            zrxToken.address,
            AssetProxyId.ERC20,
        ];
        const forwarderInstance = await ForwarderContract.deployFrom0xArtifactAsync(
            artifacts.Forwarder,
            provider,
            txDefaults,
            exchangeInstance.address,
            etherTokenInstance.address,
            zrxToken.address,
            AssetProxyId.ERC20,
        );
        forwarderContract = new ForwarderContract(forwarderInstance.abi, forwarderInstance.address, provider);
        await forwarderContract.setERC20ProxyApproval.sendTransactionAsync(AssetProxyId.ERC20, { from: owner });
        forwarderWrapper = new ForwarderWrapper(forwarderContract, provider, zrxToken.address);
        erc20Wrapper.addTokenOwnerAddress(forwarderInstance.address);

        web3Wrapper.abiDecoder.addABI(forwarderContract.abi);
        web3Wrapper.abiDecoder.addABI(exchangeInstance.abi);
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        feeProportion = 0;
        erc20Balances = await erc20Wrapper.getBalancesAsync();
        signedOrder = orderFactory.newSignedOrder();
        signedOrders = [signedOrder];
        feeOrder = orderFactory.newSignedOrder({
            makerAssetData: assetProxyUtils.encodeERC20ProxyData(zrxToken.address),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
        });
        feeOrders = [feeOrder];
        orderWithFee = orderFactory.newSignedOrder({
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
        });
        signedOrdersWithFee = [orderWithFee];
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('marketBuyTokens', () => {
        it('should fill the order', async () => {
            const fillAmount = signedOrder.takerAssetAmount.div(2);
            const makerBalanceBefore = erc20Balances[makerAddress][defaultMakerAssetAddress];
            const takerBalanceBefore = erc20Balances[takerAddress][defaultMakerAssetAddress];
            feeOrders = [];
            tx = await forwarderWrapper.marketBuyTokensAsync(signedOrders, feeOrders, {
                fillAmountWei: fillAmount,
                from: takerAddress,
            });
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerBalanceAfter = newBalances[makerAddress][defaultMakerAssetAddress];
            const takerBalanceAfter = newBalances[takerAddress][defaultMakerAssetAddress];
            const makerTokenFillAmount = fillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);

            expect(makerBalanceAfter).to.be.bignumber.equal(makerBalanceBefore.minus(makerTokenFillAmount));
            expect(takerBalanceAfter).to.be.bignumber.equal(takerBalanceBefore.plus(makerTokenFillAmount));
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(new BigNumber(0));
        });
        it('should fill the order and perform fee abstraction', async () => {
            const fillAmount = signedOrder.takerAssetAmount.div(4);
            const takerBalanceBefore = erc20Balances[takerAddress][defaultMakerAssetAddress];
            tx = await forwarderWrapper.marketBuyTokensAsync(signedOrdersWithFee, feeOrders, {
                fillAmountWei: fillAmount,
                from: takerAddress,
            });
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const takerBalanceAfter = newBalances[takerAddress][defaultMakerAssetAddress];

            const acceptPercentage = 98;
            const acceptableThreshold = takerBalanceBefore.plus(fillAmount.times(acceptPercentage).dividedBy(100));
            const isWithinThreshold = takerBalanceAfter.greaterThanOrEqualTo(acceptableThreshold);
            expect(isWithinThreshold).to.be.true();
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(new BigNumber(0));
        });
    });
    describe('marketBuyTokensFee', () => {
        it('should fill the order and send fee to fee recipient', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const fillAmount = signedOrder.takerAssetAmount.div(2);
            feeProportion = 150; // 1.5%
            feeOrders = [];
            tx = await forwarderWrapper.marketBuyTokensFeeAsync(
                signedOrders,
                feeOrders,
                feeProportion,
                feeRecipientAddress,
                {
                    fillAmountWei: fillAmount,
                    from: takerAddress,
                },
            );
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerBalanceBefore = erc20Balances[makerAddress][defaultMakerAssetAddress];
            const makerBalanceAfter = newBalances[makerAddress][defaultMakerAssetAddress];
            const takerBalanceAfter = newBalances[takerAddress][defaultMakerAssetAddress];
            const afterEthBalance = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const takerBoughtAmount = takerBalanceAfter.minus(erc20Balances[takerAddress][defaultMakerAssetAddress]);

            expect(makerBalanceAfter).to.be.bignumber.equal(makerBalanceBefore.minus(takerBoughtAmount));
            expect(afterEthBalance).to.be.bignumber.equal(
                initEthBalance.plus(fillAmount.times(feeProportion).dividedBy(10000)),
            );
            expect(newBalances[forwarderContract.address][weth.address]).to.be.bignumber.equal(new BigNumber(0));
        });
        it('should fail if the fee is set too high', async () => {
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
            const fillAmount = signedOrder.takerAssetAmount.div(2);
            feeProportion = 1500; // 15.0%
            feeOrders = [];
            try {
                tx = await forwarderWrapper.marketBuyTokensFeeAsync(
                    signedOrders,
                    feeOrders,
                    feeProportion,
                    feeRecipientAddress,
                    {
                        fillAmountWei: fillAmount,
                        from: takerAddress,
                    },
                );
                expect.fail(); // Never reached
            } catch (err) {
                const afterEthBalance = await web3Wrapper.getBalanceInWeiAsync(feeRecipientAddress);
                expect(afterEthBalance).to.be.bignumber.equal(initEthBalance);
            }
        });
    });
    describe('buyExactAssets', () => {
        it('should buy the exact amount of assets', async () => {
            const assetAmount = signedOrder.makerAssetAmount.div(2);
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const balancesBefore = await erc20Wrapper.getBalancesAsync();
            const rate = signedOrder.makerAssetAmount.dividedBy(signedOrder.takerAssetAmount);
            const fillAmount = assetAmount.dividedToIntegerBy(rate);
            feeOrders = [];
            tx = await forwarderWrapper.buyExactAssetsAsync(signedOrders, feeOrders, {
                from: takerAddress,
                assetAmount,
                fillAmountWei: fillAmount,
            });
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const takerBalanceBefore = balancesBefore[takerAddress][defaultMakerAssetAddress];
            const takerBalanceAfter = newBalances[takerAddress][defaultMakerAssetAddress];
            const afterEthBalance = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const expectedEthBalanceAfterGasCosts = initEthBalance.minus(fillAmount).minus(tx.gasUsed);
            expect(takerBalanceAfter).to.be.bignumber.eq(takerBalanceBefore.plus(assetAmount));
            expect(afterEthBalance).to.be.bignumber.eq(expectedEthBalanceAfterGasCosts);
        });
        it('should buy the exact amount of assets and return excess ETH', async () => {
            const assetAmount = signedOrder.makerAssetAmount.div(2);
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const balancesBefore = await erc20Wrapper.getBalancesAsync();
            const rate = signedOrder.makerAssetAmount.dividedBy(signedOrder.takerAssetAmount);
            const fillAmount = assetAmount.dividedToIntegerBy(rate);
            const excessFillAmount = fillAmount.times(2);
            feeOrders = [];
            tx = await forwarderWrapper.buyExactAssetsAsync(signedOrders, feeOrders, {
                from: takerAddress,
                assetAmount,
                fillAmountWei: excessFillAmount,
            });
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const takerBalanceBefore = balancesBefore[takerAddress][defaultMakerAssetAddress];
            const takerBalanceAfter = newBalances[takerAddress][defaultMakerAssetAddress];
            const afterEthBalance = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const expectedEthBalanceAfterGasCosts = initEthBalance.minus(fillAmount).minus(tx.gasUsed);
            expect(takerBalanceAfter).to.be.bignumber.eq(takerBalanceBefore.plus(assetAmount));
            expect(afterEthBalance).to.be.bignumber.eq(expectedEthBalanceAfterGasCosts);
        });
        it('should buy the exact amount of assets with fee abstraction', async () => {
            const assetAmount = signedOrder.makerAssetAmount.div(2);
            const initEthBalance = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const balancesBefore = await erc20Wrapper.getBalancesAsync();
            const rate = signedOrder.makerAssetAmount.dividedBy(signedOrder.takerAssetAmount);
            const fillAmount = assetAmount.dividedToIntegerBy(rate);
            const excessFillAmount = fillAmount.times(2);
            tx = await forwarderWrapper.buyExactAssetsAsync(signedOrdersWithFee, feeOrders, {
                from: takerAddress,
                assetAmount,
                fillAmountWei: excessFillAmount,
            });
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const takerBalanceBefore = balancesBefore[takerAddress][defaultMakerAssetAddress];
            const takerBalanceAfter = newBalances[takerAddress][defaultMakerAssetAddress];
            const afterEthBalance = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const expectedEthBalanceAfterGasCosts = initEthBalance.minus(fillAmount).minus(tx.gasUsed);
            expect(takerBalanceAfter).to.be.bignumber.eq(takerBalanceBefore.plus(assetAmount));
        });
        it('should buy the exact amount of assets when buying zrx with fee abstraction', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(zrxToken.address),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
            });
            signedOrdersWithFee = [signedOrder];
            feeOrders = [];
            const assetAmount = signedOrder.makerAssetAmount.div(2);
            const takerWeiBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const balancesBefore = await erc20Wrapper.getBalancesAsync();
            const fillAmountWei = await forwarderWrapper.calculateBuyExactFillAmountWeiAsync(
                signedOrdersWithFee,
                feeOrders,
                feeProportion,
                feeRecipientAddress,
                assetAmount,
            );
            tx = await forwarderWrapper.buyExactAssetsAsync(signedOrdersWithFee, feeOrders, {
                from: takerAddress,
                assetAmount,
                fillAmountWei,
            });
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const takerTokenBalanceBefore = balancesBefore[takerAddress][zrxToken.address];
            const takerTokenBalanceAfter = newBalances[takerAddress][zrxToken.address];
            const takerWeiBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
            const expectedCostAfterGas = fillAmountWei.plus(tx.gasUsed);
            expect(takerTokenBalanceAfter).to.be.bignumber.greaterThan(takerTokenBalanceBefore.plus(assetAmount));
            expect(takerWeiBalanceAfter).to.be.bignumber.equal(takerWeiBalanceBefore.minus(expectedCostAfterGas));
        });
    });
    describe('buyExactAssets - ERC721', async () => {
        it('buys ERC721 assets', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
            });
            feeOrders = [];
            signedOrders = [signedOrder];
            const assetAmount = new BigNumber(signedOrders.length);
            const fillAmountWei = await forwarderWrapper.calculateBuyExactFillAmountWeiAsync(
                signedOrders,
                feeOrders,
                feeProportion,
                feeRecipientAddress,
                assetAmount,
            );
            tx = await forwarderWrapper.buyExactAssetsAsync(signedOrders, feeOrders, {
                from: takerAddress,
                assetAmount,
                fillAmountWei,
            });
            const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(newOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
        });
        it('buys ERC721 assets with fee abstraction', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
            });
            signedOrders = [signedOrder];
            const assetAmount = new BigNumber(signedOrders.length);
            const fillAmountWei = await forwarderWrapper.calculateBuyExactFillAmountWeiAsync(
                signedOrders,
                feeOrders,
                feeProportion,
                feeRecipientAddress,
                assetAmount,
            );
            tx = await forwarderWrapper.buyExactAssetsAsync(signedOrders, feeOrders, {
                from: takerAddress,
                assetAmount,
                fillAmountWei,
            });
            const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(newOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
        });
        it('buys ERC721 assets with fee abstraction and pays fee to fee recipient', async () => {
            const makerAssetId = erc721MakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS_DEFAULT),
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
            });
            signedOrders = [signedOrder];
            feeProportion = 10;
            const assetAmount = new BigNumber(signedOrders.length);
            const fillAmountWei = await forwarderWrapper.calculateBuyExactFillAmountWeiAsync(
                signedOrders,
                feeOrders,
                feeProportion,
                feeRecipientAddress,
                assetAmount,
            );
            tx = await forwarderWrapper.buyExactAssetsAsync(signedOrders, feeOrders, {
                from: takerAddress,
                assetAmount,
                fillAmountWei,
            });
            const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(newOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
        });
    });
});
