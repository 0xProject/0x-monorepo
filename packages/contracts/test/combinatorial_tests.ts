import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { assetProxyUtils, crypto, orderHashUtils, OrderStateUtils } from '@0xproject/order-utils';
import { AssetProxyId, SignatureType, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import ethUtil = require('ethereumjs-util');
import 'make-promises-safe';

import { DummyERC20TokenContract } from '../src/contract_wrappers/generated/dummy_e_r_c20_token';
import { DummyERC721TokenContract } from '../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { ERC20ProxyContract } from '../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../src/contract_wrappers/generated/e_r_c721_proxy';
import {
    CancelContractEventArgs,
    ExchangeContract,
    FillContractEventArgs,
} from '../src/contract_wrappers/generated/exchange';
import { artifacts } from '../src/utils/artifacts';
import { chaiSetup } from '../src/utils/chai_setup';
import { constants } from '../src/utils/constants';
import { ERC20Wrapper } from '../src/utils/erc20_wrapper';
import { ERC721Wrapper } from '../src/utils/erc721_wrapper';
import { ExchangeWrapper } from '../src/utils/exchange_wrapper';
import { NewOrderFactory } from '../src/utils/new_order_factory';
import { OrderInfoUtils } from '../src/utils/order_info_utils';
import { orderUtils } from '../src/utils/order_utils';
import { signingUtils } from '../src/utils/signing_utils';
import {
    AssetDataScenario,
    ContractName,
    ERC20BalancesByOwner,
    ExpirationTimeSecondsScenario,
    FeeRecipientAddressScenario,
    OrderAmountScenario,
    OrderStatus,
} from '../src/utils/types';

import { provider, txDefaults, web3Wrapper } from '../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Combinatorial tests', () => {
    let newOrderFactory: NewOrderFactory;
    let usedAddresses: string[];

    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let erc20EighteenDecimalTokenA: DummyERC20TokenContract;
    let erc20EighteenDecimalTokenB: DummyERC20TokenContract;
    let erc20FiveDecimalTokenA: DummyERC20TokenContract;
    let erc20FiveDecimalTokenB: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let erc20Balances: ERC20BalancesByOwner;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;

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
        usedAddresses = [owner, makerAddress, takerAddress, feeRecipientAddress] = accounts;

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        const erc20EighteenDecimalTokenCount = 3;
        const eighteenDecimals = new BigNumber(18);
        [erc20EighteenDecimalTokenA, erc20EighteenDecimalTokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            erc20EighteenDecimalTokenCount,
            eighteenDecimals,
        );

        const erc20FiveDecimalTokenCount = 2;
        const fiveDecimals = new BigNumber(18);
        [erc20FiveDecimalTokenA, erc20FiveDecimalTokenB] = await erc20Wrapper.deployDummyTokensAsync(
            erc20FiveDecimalTokenCount,
            fiveDecimals,
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
            assetProxyUtils.encodeERC20ProxyData(zrxToken.address),
        );
        exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC20, erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC721, erc721Proxy.address, owner);

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

        defaultMakerAssetAddress = erc20EighteenDecimalTokenA.address;
        defaultTakerAssetAddress = erc20EighteenDecimalTokenB.address;

        newOrderFactory = new NewOrderFactory(
            usedAddresses,
            zrxToken.address,
            [erc20EighteenDecimalTokenA.address, erc20EighteenDecimalTokenB.address],
            [erc20FiveDecimalTokenA.address, erc20FiveDecimalTokenB.address],
            erc721Token,
            erc721Balances,
            exchange.address,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe.only('Fill order', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
        });
        it('should transfer the correct amounts when makerAssetAmount === takerAssetAmount', async () => {
            const order = newOrderFactory.generateOrder(
                FeeRecipientAddressScenario.EthUserAddress,
                OrderAmountScenario.NonZero,
                OrderAmountScenario.NonZero,
                OrderAmountScenario.Zero,
                OrderAmountScenario.Zero,
                ExpirationTimeSecondsScenario.InFuture,
                AssetDataScenario.ERC20NonZRXEighteenDecimals,
                AssetDataScenario.ERC20NonZRXEighteenDecimals,
            );

            // TODO: Permute signature types

            // TODO: Sign order (for now simply ECSign)
            const orderHashBuff = orderHashUtils.getOrderHashBuff(order);
            const privateKey = constants.TESTRPC_PRIVATE_KEYS[usedAddresses.indexOf(makerAddress)];
            const signature = signingUtils.signMessage(orderHashBuff, privateKey, SignatureType.EthSign);
            const signedOrder = {
                ...order,
                signature: `0x${signature.toString('hex')}`,
            };
            console.log('signedOrder', signedOrder);

            // TODO: Get orderRelevantState
            const orderInfoUtils = new OrderInfoUtils(exchange, erc20Wrapper, zrxToken.address);
            // 1. How much of this order can I fill?
            const fillableTakerAssetAmount = await orderInfoUtils.getFillableTakerAssetAmountAsync(
                signedOrder,
                takerAddress,
            );
            console.log('fillableTakerAssetAmount', fillableTakerAssetAmount);

            // TODO: Decide how much to fill (all, some)
            const takerFillAmount = fillableTakerAssetAmount.div(2); // some for now

            // 2. If I fill it by X, what are the resulting balances/allowances/filled amounts expected?
            // NOTE: we can't use orderStateUtils for this :( We need to do this ourselves.

            // This doesn't include taker balance/allowance checks...
            /*
                Inputs:
                    - signedOrder
                    - takerAddress
                Outputs:
                    - Check fillable amount
                    - maker token balance & allowance
                    - maker ZRX balance & allowance
                    - taker token balance & allowance
                    - taker ZRX balance & allowance
                Test:
                    - If fillable >= fillAmount:
                        - check that filled by fillAmount
                        - check makerBalance
            */

            //     signedOrder = orderFactory.newSignedOrder({
            //         makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            //         takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            //     }); );
            //
            // const takerAssetFilledAmountBefore = await exchangeWrapper.getTakerAssetFilledAmountAsync(
            //         orderHashUtils.getOrderHashHex(signedOrder),
            //     );
            // expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);
            //
            // const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            // await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            //
            // const makerAmountBoughtAfter = await exchangeWrapper.getTakerAssetFilledAmountAsync(
            //         orderHashUtils.getOrderHashHex(signedOrder),
            //     );
            // expect(makerAmountBoughtAfter).to.be.bignumber.equal(takerAssetFillAmount);
            //
            // const newBalances = await erc20Wrapper.getBalancesAsync();
            //
            // const makerAssetFilledAmount = takerAssetFillAmount
            //         .times(signedOrder.makerAssetAmount)
            //         .dividedToIntegerBy(signedOrder.takerAssetAmount);
            // const makerFeePaid = signedOrder.makerFee
            //         .times(makerAssetFilledAmount)
            //         .dividedToIntegerBy(signedOrder.makerAssetAmount);
            // const takerFeePaid = signedOrder.takerFee
            //         .times(makerAssetFilledAmount)
            //         .dividedToIntegerBy(signedOrder.makerAssetAmount);
            // expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
            //         erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
            //     );
            // expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
            //         erc20Balances[makerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            //     );
            // expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
            //         erc20Balances[makerAddress][zrxToken.address].minus(makerFeePaid),
            //     );
            // expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
            //         erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            //     );
            // expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
            //         erc20Balances[takerAddress][defaultMakerAssetAddress].add(makerAssetFilledAmount),
            //     );
            // expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
            //         erc20Balances[takerAddress][zrxToken.address].minus(takerFeePaid),
            //     );
            // expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
            //         erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
            //     );
        });
    });
});
