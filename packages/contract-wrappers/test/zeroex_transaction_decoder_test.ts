import { assetDataUtils } from '@0x/order-utils';
import * as chai from 'chai';
import 'mocha';
import * as _ from 'lodash';
import { addressUtils, BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import {
    constants,
    OrderFactory,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { SignedOrder } from '@0x/types';

import { TransactionEncoder, ZeroExTransactionDecoder } from '../src';
import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe.only('ZeroExTransactionDecoder', () => {
    let orderFactory: OrderFactory;
    let defaultERC20MakerAssetAddress = addressUtils.generatePseudoRandomAddress();
    let defaultERC20TakerAssetAddress = addressUtils.generatePseudoRandomAddress();
    let signedOrderLeft: SignedOrder;
    let signedOrderRifght: SignedOrder;
    let matchOrdersTxData: string;
    const sampleMatchOrdersTxData = '0x3c28d861000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000002c000000000000000000000000000000000000000000000000000000000000004800000000000000000000000000000000000000000000000000000000000000500000000000000000000000000da912ecc847b3d98ca882e396e693e485deed5180000000000000000000000000681e844593a051e2882ec897ecd5444efe19ff20000000000000000000000008124071f810d533ff63de61d0c98db99eeb99d640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008bb6a7394e2f000000000000000000000000000000000000000000000000868cab59cce788000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005c51035008197e43b4d84439ec534b62670eaaaf4a46f50ff37ff62f6d1c1fbe8b036d3c000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000503f9794d6a6bb0df8fbb19a2b3e2aeab35339ad000000000000000000000000000000000000000000000000000000000000000000000000000000003997d0f55d1daa549e95c240bc6353636f4cf9740000000000000000000000000681e844593a051e2882ec897ecd5444efe19ff20000000000000000000000008124071f810d533ff63de61d0c98db99eeb99d6400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000871bcc4c32c9d66800000000000000000000000000000000000000000000000000008a70a4d2d2100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005c510350c20e53540c9b2c9207ad9a04e472e2224af211f08efc2f0eec15d7e1cfbf2109000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000421c8f294b2728c269a9d01a1b58fe7cae2ef7895bd2de48cc3101eb47464d96594340924793fc8325db26a3abd5602605806a82ca77e810494c5ecab58b03449de80300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000421c372d6daa8e6ce2c696e51b6e1e33f10fd2b41b403cd88c311a617c3656ea02fe454e51cddf4682751bea9a02ce725cf364d1107f27be427d5157adbdcca2609b03000000000000000000000000000000000000000000000000000000000000';

    before(async () => {
        // Create accounts
        const accounts = await web3Wrapper.getAvailableAddressesAsync();

        let makerAddressLeft =  addressUtils.generatePseudoRandomAddress();
        let makerAddressRight = addressUtils.generatePseudoRandomAddress();
        const exchangeAddress = addressUtils.generatePseudoRandomAddress();
        const feeRecipientAddress = addressUtils.generatePseudoRandomAddress();;
         // Create orders to match
         const defaultOrderParamsLeft = {
            makerAddress: makerAddressLeft,
            exchangeAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
            feeRecipientAddress,
        };
        const defaultOrderParamsRight = {
            makerAddress: makerAddressRight,
            exchangeAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20TakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            feeRecipientAddress,
        };
        
        const privateKeyLeft = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressLeft)];
        const orderFactoryLeft = new OrderFactory(privateKeyLeft, defaultOrderParamsLeft);
        const privateKeyRight = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressRight)];
        const orderFactoryRight = new OrderFactory(privateKeyRight, defaultOrderParamsRight);

        const signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            takerAssetAmount: new BigNumber(1),
        });
        const signedOrderRight = await orderFactoryRight.newSignedOrderAsync({
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            makerAssetAmount: new BigNumber(1),
            takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(8), 18),
        });
        
        
        //matchOrdersTxData = TransactionEncoder.matchOrdersTx(signedOrderLeft, signedOrderRight);
    });

    describe('decode', () => {
        /*
        it('should successfully decode DutchAuction.matchOrders txData', async () => {
            const decodedTxData = ZeroExTransactionDecoder.decode(matchOrdersTxData, { contractName: 'DutchAuction' }); //{networkId: 1, contractAddress: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b'});
            console.log(decodedTxData);
        });
        it('should successfully decode Exchange.matchOrders txData', async () => {
            const decodedTxData = ZeroExTransactionDecoder.decode(matchOrdersTxData, { contractName: 'Exchange' }); //{networkId: 1, contractAddress: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b'});
            console.log(decodedTxData);
        });
        it('should successfully decode Exchange.matchOrders, using exchange address to identify the exchange contract', async () => {
            const decodedTxData = ZeroExTransactionDecoder.decode(matchOrdersTxData, {networkId: 1, contractAddress: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b'});
            console.log(decodedTxData);
        });
        it('should throw if cannot decode txData', async () => {
            const decodedTxData = ZeroExTransactionDecoder.decode(matchOrdersTxData, {networkId: 1, contractAddress: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b'});
            console.log(decodedTxData);
        });*/
    });

    describe('addABI', () => {
        /*it('should successfully add a new ABI', async () => {
            const decodedTxData = ZeroExTransactionDecoder.decode(matchOrdersTxData, { contractName: 'DutchAuction' }); //{networkId: 1, contractAddress: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b'});
            console.log(decodedTxData);
        });*/
    });
});
