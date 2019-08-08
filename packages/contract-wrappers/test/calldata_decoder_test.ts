import { constants, OrderFactory } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { addressUtils, BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { ContractAddresses, ContractWrappers } from '../src';
import { getAbiEncodedTransactionData } from '../src/utils/getAbiEncodedTransactionData';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ABI Decoding Calldata', () => {
    const defaultERC20MakerAssetAddress = addressUtils.generatePseudoRandomAddress();
    const matchOrdersSignature =
        'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)';
    let signedOrderLeft: SignedOrder;
    let signedOrderRight: SignedOrder;
    let orderLeft = {};
    let orderRight = {};
    let matchOrdersTxData: string;
    let contractAddresses: ContractAddresses;
    let contractWrappers: ContractWrappers;

    before(async () => {
        // Create accounts
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const [makerAddressLeft, makerAddressRight] = accounts;
        const [privateKeyLeft, privateKeyRight] = constants.TESTRPC_PRIVATE_KEYS;
        const exchangeAddress = addressUtils.generatePseudoRandomAddress();
        const feeRecipientAddress = addressUtils.generatePseudoRandomAddress();
        // Create orders to match.
        // Values are arbitrary, with the exception of maker addresses (generated above).
        orderLeft = {
            makerAddress: makerAddressLeft,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            makerAssetAmount: new BigNumber(10),
            takerAddress: '0x0000000000000000000000000000000000000000',
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            takerAssetAmount: new BigNumber(1),
            feeRecipientAddress,
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            senderAddress: '0x0000000000000000000000000000000000000000',
            expirationTimeSeconds: new BigNumber(1549498915),
            salt: new BigNumber(217),
        };
        orderRight = {
            makerAddress: makerAddressRight,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            makerAssetAmount: new BigNumber(1),
            takerAddress: '0x0000000000000000000000000000000000000000',
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultERC20MakerAssetAddress),
            takerAssetAmount: new BigNumber(8),
            feeRecipientAddress,
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            senderAddress: '0x0000000000000000000000000000000000000000',
            expirationTimeSeconds: new BigNumber(1549498915),
            salt: new BigNumber(50010),
        };
        const orderFactoryLeft = new OrderFactory(privateKeyLeft, orderLeft);
        signedOrderLeft = await orderFactoryLeft.newSignedOrderAsync({ exchangeAddress });
        const orderFactoryRight = new OrderFactory(privateKeyRight, orderRight);
        signedOrderRight = await orderFactoryRight.newSignedOrderAsync({ exchangeAddress });
        // Encode match orders transaction
        contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses,
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        matchOrdersTxData = getAbiEncodedTransactionData(
            contractWrappers.exchange,
            'matchOrders',
            signedOrderLeft,
            signedOrderRight,
            signedOrderLeft.signature,
            signedOrderRight.signature,
        );
    });

    describe('decode', () => {
        it('should successfully decode DutchAuction.matchOrders calldata', async () => {
            const contractName = 'DutchAuction';
            const decodedTxData = contractWrappers
                .getAbiDecoder()
                .decodeCalldataOrThrow(matchOrdersTxData, contractName);
            const expectedFunctionName = 'matchOrders';
            const expectedFunctionArguments = {
                buyOrder: orderLeft,
                sellOrder: orderRight,
                buySignature: signedOrderLeft.signature,
                sellSignature: signedOrderRight.signature,
            };
            expect(decodedTxData.functionName).to.be.equal(expectedFunctionName);
            expect(decodedTxData.functionSignature).to.be.equal(matchOrdersSignature);
            expect(decodedTxData.functionArguments).to.be.deep.equal(expectedFunctionArguments);
        });
        it('should successfully decode Exchange.matchOrders calldata (and distinguish from DutchAuction.matchOrders)', async () => {
            const contractName = 'Exchange';
            const decodedTxData = contractWrappers
                .getAbiDecoder()
                .decodeCalldataOrThrow(matchOrdersTxData, contractName);
            const expectedFunctionName = 'matchOrders';
            const expectedFunctionArguments = {
                leftOrder: orderLeft,
                rightOrder: orderRight,
                leftSignature: signedOrderLeft.signature,
                rightSignature: signedOrderRight.signature,
            };
            expect(decodedTxData.functionName).to.be.equal(expectedFunctionName);
            expect(decodedTxData.functionSignature).to.be.equal(matchOrdersSignature);
            expect(decodedTxData.functionArguments).to.be.deep.equal(expectedFunctionArguments);
        });
        it('should throw if cannot decode calldata', async () => {
            const badTxData = '0x01020304';
            expect(() => {
                contractWrappers.getAbiDecoder().decodeCalldataOrThrow(badTxData);
            }).to.throw("No functions registered for selector '0x01020304'");
        });
    });
});
