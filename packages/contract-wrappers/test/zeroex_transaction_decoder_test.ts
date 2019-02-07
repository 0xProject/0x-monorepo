import { constants, OrderFactory } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { AbiEncoder, addressUtils, BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { MethodAbi } from 'ethereum-types';
import * as _ from 'lodash';
import 'mocha';

import { ContractAddresses, ContractWrappers } from '../src';
import { ZeroExTransactionDecoder } from '../src/utils/zeroex_transaction_decoder';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe.only('ZeroExTransactionDecoder', () => {
    const defaultERC20MakerAssetAddress = addressUtils.generatePseudoRandomAddress();
    const matchOrdersSignature =
        'matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)';
    let signedOrderLeft: SignedOrder;
    let signedOrderRight: SignedOrder;
    let orderLeft = {};
    let orderRight = {};
    let matchOrdersTxData: string;
    let contractAddresses: ContractAddresses;

    before(async () => {
        // Create accounts
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const [makerAddressLeft, makerAddressRight] = accounts.slice(0, 2);
        const exchangeAddress = addressUtils.generatePseudoRandomAddress();
        const feeRecipientAddress = addressUtils.generatePseudoRandomAddress();
        const privateKeyLeft = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressLeft)];
        const privateKeyRight = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddressRight)];
        // Create orders to match
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
        const contractWrappers = new ContractWrappers(provider, config);
        const transactionEncoder = await contractWrappers.exchange.transactionEncoderAsync();
        matchOrdersTxData = transactionEncoder.matchOrdersTx(signedOrderLeft, signedOrderRight);
    });

    describe('decode', () => {
        it('should successfully decode DutchAuction.matchOrders txData', async () => {
            const contractName = 'DutchAuction';
            const decodedTxData = ZeroExTransactionDecoder.decode(matchOrdersTxData, { contractName });
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
        it('should successfully decode Exchange.matchOrders txData (and distinguish from DutchAuction.matchOrders)', async () => {
            const contractName = 'Exchange';
            const decodedTxData = ZeroExTransactionDecoder.decode(matchOrdersTxData, { contractName });
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
        it('should successfully decode Exchange.matchOrders, using exchange address to identify the exchange contract', async () => {
            const contractAddress = contractAddresses.exchange;
            const decodedTxData = ZeroExTransactionDecoder.decode(matchOrdersTxData, { contractAddress });
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
        it('should throw if cannot decode txData', async () => {
            const contractAddress = contractAddresses.exchange;
            const badTxData = '0x01020304';
            expect(() => {
                ZeroExTransactionDecoder.decode(badTxData, { contractAddress });
            }).to.throw("No functions registered for selector '0x01020304'");
        });
    });

    describe('addABI', () => {
        it('should successfully add a new ABI', async () => {
            // Add new ABI
            const abi: MethodAbi = {
                name: 'foobar',
                type: 'function',
                inputs: [
                    {
                        name: 'addr',
                        type: 'address',
                    },
                ],
                outputs: [
                    {
                        name: 'butter',
                        type: 'string',
                    },
                ],
                constant: false,
                payable: false,
                stateMutability: 'pure',
            };
            const contractName = 'newContract';
            const contractAddress = addressUtils.generatePseudoRandomAddress();
            const networkId = 1;
            const contractInfo = [
                {
                    contractAddress,
                    networkId,
                },
            ];
            ZeroExTransactionDecoder.addABI([abi], contractName, contractInfo);
            // Create some tx data
            const foobarEncoder = new AbiEncoder.Method(abi);
            const foobarSignature = foobarEncoder.getSignature();
            const foobarTxData = foobarEncoder.encode([contractAddress]);
            // Decode tx data using contract name
            const decodedTxData = ZeroExTransactionDecoder.decode(foobarTxData, { contractName });
            const expectedFunctionName = abi.name;
            const expectedFunctionArguments = {
                addr: contractAddress,
            };
            expect(decodedTxData.functionName).to.be.equal(expectedFunctionName);
            expect(decodedTxData.functionSignature).to.be.equal(foobarSignature);
            expect(decodedTxData.functionArguments).to.be.deep.equal(expectedFunctionArguments);
            // Decode tx data using contract address
            const decodedTxDataDecodedWithAddress = ZeroExTransactionDecoder.decode(foobarTxData, { contractAddress });
            expect(decodedTxDataDecodedWithAddress).to.be.deep.equal(decodedTxData);
        });
    });
});
