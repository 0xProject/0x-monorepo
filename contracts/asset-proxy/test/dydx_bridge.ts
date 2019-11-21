import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    hexLeftPad,
    hexRandom,
    OrderFactory,
    orderHashUtils,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { DecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';
import * as ethUtil from 'ethereumjs-util';

import { artifacts } from './artifacts';

import { DydxBridgeContract, IAssetDataContract, TestDydxBridgeContract } from './wrappers';

blockchainTests.resets.only('Dydx unit tests', env => {
    const dydxAccountNumber = new BigNumber(1);
    const dydxFromMarketId = new BigNumber(2);
    const dydxToMarketId = new BigNumber(3);
    let testContract: DydxBridgeContract;
    let owner: string;
    let dydxAccountOwner: string;
    let bridgeDataEncoder: AbiEncoder.DataType;
    let eip1271Encoder: TestDydxBridgeContract;
    let assetDataEncoder: IAssetDataContract;
    let orderFactory: OrderFactory;

    before(async () => {
        // Deploy dydx bridge
        testContract = await DydxBridgeContract.deployFrom0xArtifactAsync(
            artifacts.DydxBridge,
            env.provider,
            env.txDefaults,
            artifacts,
        );

        // Get accounts
        const accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        [owner, dydxAccountOwner] = accounts;
        const dydxAccountOwnerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(dydxAccountOwner)];

        // Create order factory for dydx bridge
        const chainId = await env.getChainIdAsync();
        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress: testContract.address,
            feeRecipientAddress: randomAddress(),
            makerAssetData: constants.NULL_BYTES,
            takerAssetData: constants.NULL_BYTES,
            makerFeeAssetData: constants.NULL_BYTES,
            takerFeeAssetData: constants.NULL_BYTES,
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
            exchangeAddress: constants.NULL_ADDRESS,
            chainId,
        };
        orderFactory = new OrderFactory(dydxAccountOwnerPrivateKey, defaultOrderParams);

        // Create encoder for Bridge Data
        bridgeDataEncoder = AbiEncoder.create([
            {name: 'dydxAccountOwner', type: 'address'},
            {name: 'dydxAccountNumber', type: 'uint256'},
            {name: 'dydxAccountOperator', type: 'address'},
            {name: 'dydxFromMarketId', type: 'uint256'},
            {name: 'dydxToMarketId', type: 'uint256'},
            {name: 'shouldDepositIntoDydx', type: 'bool'},
            {name: 'fromTokenAddress', type: 'address'},
        ]);

        // Create encoders
        assetDataEncoder = new IAssetDataContract(constants.NULL_ADDRESS, env.provider);
        eip1271Encoder = new TestDydxBridgeContract(constants.NULL_ADDRESS, env.provider);
    });

    describe('isValidSignature()', () => {
        const SUCCESS_BYTES = '0x20c13b0b';

        it('returns success bytes if signature is valid', async () => {
            // Construct valid bridge data for dydx account owner
            const bridgeData = {
                dydxAccountOwner,
                dydxAccountNumber,
                dydxAccountOperator: constants.NULL_ADDRESS,
                dydxFromMarketId,
                dydxToMarketId,
                shouldDepositIntoDydx: false,
                fromTokenAddress: constants.NULL_ADDRESS,
            };
            const encodedBridgeData = bridgeDataEncoder.encode(bridgeData);

            // Construct valid order from dydx account owner
            const makerAssetData = assetDataEncoder
                .ERC20Bridge(
                    constants.NULL_ADDRESS,
                    testContract.address,
                    encodedBridgeData
                )
            .getABIEncodedTransactionData()
            const signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData,
            });
            const signedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);

            // Encode `isValidSignature` parameters
            const eip1271Data = eip1271Encoder.OrderWithHash(signedOrder, signedOrderHash).getABIEncodedTransactionData();
            const eip1271Signature = ethUtil.bufferToHex(ethUtil.toBuffer(signedOrder.signature).slice(0, 65)); // pop signature type from end

            // Validate signature
            const result = await testContract.isValidSignature(eip1271Data, eip1271Signature).callAsync();
            expect(result).to.eq(SUCCESS_BYTES);
        });
    });
});
