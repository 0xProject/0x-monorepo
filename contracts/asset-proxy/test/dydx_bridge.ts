import { blockchainTests, constants, expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { AssetProxyId, RevertReason } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { TestDydxBridgeContract, TestDydxBridgeEvents } from './wrappers';

blockchainTests.resets.only('DydxBridge unit tests', env => {
    const accountNumber = new BigNumber(1);
    const marketId = new BigNumber(2);
    const notAuthorized = '0x0000000000000000000000000000000000000001';
    let testContract: TestDydxBridgeContract;
    let authorized: string;
    let accountOwner: string;
    let receiver: string;

    before(async () => {
        // Get accounts
        const accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        [, /* owner */ authorized, accountOwner, receiver] = accounts;

        // Deploy dydx bridge
        testContract = await TestDydxBridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestDydxBridge,
            env.provider,
            env.txDefaults,
            artifacts,
        );

        const abi = {
            constant: false,
            inputs: [
                {
                    name: 'accounts',
                    type: 'tuple[]',
                    components: [
                        {
                            name: 'owner',
                            type: 'address',
                        },
                        {
                            name: 'number',
                            type: 'uint256',
                        },
                    ]
                },
                {
                    name: 'actions',
                    type: 'tuple[]',
                    components: [
                        {
                            name: 'actionType',
                            type: 'uint8',
                        },
                        {
                            name: 'accountId',
                            type: 'uint256',
                        },
                        {
                            name: 'amount',
                            type: 'tuple',
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'denomination',
                                    type: 'uint8',
                                },
                                {
                                    name: 'ref',
                                    type: 'uint8',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ]
                        },
                        {
                            name: 'primaryMarketId',
                            type: 'uint256',
                        },
                        {
                            name: 'secondaryMarketId',
                            type: 'uint256',
                        },
                        {
                            name: 'otherAddress',
                            type: 'address',
                        },
                        {
                            name: 'otherAccountId',
                            type: 'uint256',
                        },
                        {
                            name: 'data',
                            type: 'bytes',
                        },
                    ]
                },
                {
                    name: 'sendEthTo',
                    type: 'address',
                }
            ],
            name: 'operate',
            outputs: [
            ],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
        };

        const encoder = AbiEncoder.createMethod("operate", abi.inputs);

        //console.log(testContract.getFunctionSignature("operate"));
        const a = encoder.decode("0xf319142a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000001916a90bafe25771485e182a96132e200daffdd100000000000000000000000000000000000000000000000000000000000000010000000000000000000000001916a90bafe25771485e182a96132e200daffdd1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000739a1df6725657f6a16dc2d5519dc36fd7911a120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000001000000000000000000000000f809e07870dca762b9536d61a4fbef1a17178092000000000000000000000000000000000000000000000000000000000024ea0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a8b39829ce2246f89b31c013b8cde15506fb9a76000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000000");
        console.log(JSON.stringify(a, null, 4));
    });

    describe('bridgeTransferFrom()', () => {
        interface BridgeData {
            action: number;
            accountNumber: BigNumber;
            marketId: BigNumber;
        }
        enum DydxBridgeActions {
            Deposit,
            Withdraw,
        }
        let defaultBridgeData: any;
        let bridgeDataEncoder: AbiEncoder.DataType;
        const callBridgeTransferFrom = async (
            from: string,
            to: string,
            bridgeData: BridgeData,
            sender: string,
        ): Promise<string> => {
            const returnValue = await testContract
                .bridgeTransferFrom(
                    constants.NULL_ADDRESS,
                    from,
                    to,
                    new BigNumber(1),
                    bridgeDataEncoder.encode(bridgeData),
                )
                .callAsync({ from: sender });
            return returnValue;
        };
        const callBridgeTransferFromAndVerifyEvents = async (
            actionType: number,
            actionAddress: string,
            from: string,
            to: string,
            bridgeData: BridgeData,
            sender: string,
        ): Promise<void> => {
            // Execute transaction.
            const txReceipt = await testContract
                .bridgeTransferFrom(
                    constants.NULL_ADDRESS,
                    from,
                    to,
                    new BigNumber(1),
                    bridgeDataEncoder.encode(bridgeData),
                )
                .awaitTransactionSuccessAsync({ from: sender });

            // Verify `OperateAccount` event.
            verifyEventsFromLogs(
                txReceipt.logs,
                [
                    {
                        owner: accountOwner,
                        number: accountNumber,
                    },
                ],
                TestDydxBridgeEvents.OperateAccount,
            );

            // Verify `OperateAction` event.
            const accountId = new BigNumber(0);
            const positiveAmountSign = true;
            const weiDenomination = 0;
            const absoluteAmountRef = 1;
            verifyEventsFromLogs(
                txReceipt.logs,
                [
                    {
                        actionType,
                        accountId,
                        amountSign: positiveAmountSign,
                        amountDenomination: weiDenomination,
                        amountRef: absoluteAmountRef,
                        amountValue: new BigNumber(1),
                        primaryMarketId: marketId,
                        secondaryMarketId: constants.ZERO_AMOUNT,
                        otherAddress: actionAddress,
                        otherAccountId: constants.ZERO_AMOUNT,
                        data: '0x',
                    },
                ],
                TestDydxBridgeEvents.OperateAction,
            );
        };
        before(async () => {
            // Construct default bridge data
            defaultBridgeData = {
                action: DydxBridgeActions.Deposit as number,
                accountNumber,
                marketId,
            };

            // Create encoder for bridge data
            bridgeDataEncoder = AbiEncoder.create([
                { name: 'action', type: 'uint8' },
                { name: 'accountNumber', type: 'uint256' },
                { name: 'marketId', type: 'uint256' },
            ]);
        });
        it('succeeds when calling `operate` with the `deposit` action', async () => {
            const depositAction = 0;
            const bridgeData = {
                ...defaultBridgeData,
                action: depositAction,
            };
            await callBridgeTransferFromAndVerifyEvents(
                depositAction,
                accountOwner,
                receiver,
                accountOwner,
                bridgeData,
                authorized,
            );
        });
        it('succeeds when calling `operate` with the `withdraw` action', async () => {
            const withdrawAction = 1;
            const bridgeData = {
                ...defaultBridgeData,
                action: withdrawAction,
            };
            await callBridgeTransferFromAndVerifyEvents(
                withdrawAction,
                receiver,
                accountOwner,
                receiver,
                bridgeData,
                authorized,
            );
        });
        it('reverts if not called by the ERC20 Bridge Proxy', async () => {
            const callBridgeTransferFromPromise = callBridgeTransferFrom(
                accountOwner,
                receiver,
                defaultBridgeData,
                notAuthorized,
            );
            const expectedError = RevertReason.DydxBridgeOnlyCallableByErc20BridgeProxy;
            return expect(callBridgeTransferFromPromise).to.revertWith(expectedError);
        });
        it('should return magic bytes if call succeeds', async () => {
            const returnValue = await callBridgeTransferFrom(accountOwner, receiver, defaultBridgeData, authorized);
            expect(returnValue).to.equal(AssetProxyId.ERC20Bridge);
        });
    });
});
