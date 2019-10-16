import * as bip39 from 'bip39';
import * as chai from 'chai';
import ethereumjsWallet = require('ethereumjs-wallet');
import HDNode = require('hdkey');

import { getContractAddressesForNetworkOrThrow, NetworkId } from '@0x/contract-addresses';
import { chaiSetup, constants, OrderFactory } from '@0x/contracts-test-utils';
import { web3Factory } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { logUtils, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { DevUtilsContract } from '../src';

const networkId = parseInt(process.env.NETWORK_ID as string, 10);
const mnemonic = process.env.MNEMONIC as string;
const rpcUrl = process.env.RPC_URL;

chaiSetup.configure();
const expect = chai.expect;

const provider = web3Factory.getRpcProvider({ rpcUrl });
const web3 = new Web3Wrapper(provider);

const privateKey = HDNode.fromMasterSeed(bip39.mnemonicToSeed(mnemonic)).privateKey;

const makerAddress = `0x${ethereumjsWallet
    .fromPrivateKey(privateKey)
    .getAddress()
    .toString('hex')}`;

const addresses = getContractAddressesForNetworkOrThrow(networkId);

const devUtils = new DevUtilsContract(addresses.devUtils, provider, { from: makerAddress });

describe('OrderValidationUtils on Kovan', () => {
    let orderFactory: OrderFactory;

    before(async () => {
        orderFactory = new OrderFactory(privateKey, {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerAssetData: assetDataUtils.encodeERC20AssetData(addresses.zrxToken),
            takerAssetData: assetDataUtils.encodeERC20AssetData(addresses.etherToken),
            makerFeeAssetData: constants.NULL_ADDRESS,
            takerFeeAssetData: constants.NULL_ADDRESS,
            exchangeAddress: addresses.exchange,
            chainId: await providerUtils.getChainIdAsync(provider),
        });
    });

    it('should return the correct fillabeTakerassetAmount when there are no maker fees', async () => {
        const signedOrder = await orderFactory.newSignedOrderAsync({
            makerFee: constants.ZERO_AMOUNT,
            makerFeeAssetData: '0x',
            takerFeeAssetData: '0x',
        });

        logUtils.log(`order: ${JSON.stringify(signedOrder, null, '\t')}`);

        const [, fillableTakerAssetAmount] = await devUtils.getOrderRelevantState.callAsync(
            signedOrder,
            signedOrder.signature,
        );
        expect(fillableTakerAssetAmount).to.bignumber.equal(0); // because no balance or allowance
    });
});
