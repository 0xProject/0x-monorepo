import { blockchainTests, constants, expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { AssetProxyId, RevertReason } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { TestDydxBridgeContract, TestDydxBridgeEvents } from './wrappers';

blockchainTests.resets('DydxBridge unit tests', env => {
    const defaultAccountNumber = new BigNumber(1);
    const marketId = new BigNumber(2);
    const defaultAmount = new BigNumber(4);
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
    });

    describe('bridgeTransferFrom()', () => {
        enum BridgeActionType {
            Deposit,
            Withdraw,
        }
        interface BrigeAction {
            actionType: BridgeActionType;
            accountId: BigNumber;
            marketId: BigNumber;
            conversionRateNumerator: BigNumber;
            conversionRateDenominator: BigNumber;
        }
        interface BridgeData {
            accountNumbers: BigNumber[];
            actions: BrigeAction[];
        }
        const defaultDepositAction = {
            actionType: BridgeActionType.Deposit as number,
            accountId: constants.ZERO_AMOUNT,
            marketId,
            conversionRateNumerator: constants.ZERO_AMOUNT,
            conversionRateDenominator: constants.ZERO_AMOUNT,
        };
        const defaultWithdrawAction = {
            actionType: BridgeActionType.Withdraw as number,
            accountId: constants.ZERO_AMOUNT,
            marketId,
            conversionRateNumerator: constants.ZERO_AMOUNT,
            conversionRateDenominator: constants.ZERO_AMOUNT,
        };
        const bridgeDataEncoder = AbiEncoder.create([
            {
                name: 'bridgeData',
                type: 'tuple',
                components: [
                    { name: 'accountNumbers', type: 'uint256[]' },
                    {
                        name: 'actions',
                        type: 'tuple[]',
                        components: [
                            { name: 'actionType', type: 'uint8' },
                            { name: 'accountId', type: 'uint256' },
                            { name: 'marketId', type: 'uint256' },
                            { name: 'conversionRateNumerator', type: 'uint256' },
                            { name: 'conversionRateDenominator', type: 'uint256' },
                        ],
                    },
                ],
            },
        ]);
        const callBridgeTransferFrom = async (
            from: string,
            to: string,
            amount: BigNumber,
            bridgeData: BridgeData,
            sender: string,
        ): Promise<string> => {
            const returnValue = await testContract
                .bridgeTransferFrom(constants.NULL_ADDRESS, from, to, amount, bridgeDataEncoder.encode({ bridgeData }))
                .callAsync({ from: sender });
            return returnValue;
        };
        const callBridgeTransferFromAndVerifyEvents = async (
            from: string,
            to: string,
            amount: BigNumber,
            bridgeData: BridgeData,
            sender: string,
        ): Promise<void> => {
            // Execute transaction.
            const txReceipt = await testContract
                .bridgeTransferFrom(constants.NULL_ADDRESS, from, to, amount, bridgeDataEncoder.encode({ bridgeData }))
                .awaitTransactionSuccessAsync({ from: sender });

            // Verify `OperateAccount` event.
            const expectedOperateAccountEvents = [];
            for (const accountNumber of bridgeData.accountNumbers) {
                expectedOperateAccountEvents.push({
                    owner: accountOwner,
                    number: accountNumber,
                });
            }
            verifyEventsFromLogs(txReceipt.logs, expectedOperateAccountEvents, TestDydxBridgeEvents.OperateAccount);

            // Verify `OperateAction` event.
            const positiveAmountSign = true;
            const weiDenomination = 0;
            const absoluteAmountRef = 1;
            const expectedOperateActionEvents = [];
            for (const action of bridgeData.actions) {
                expectedOperateActionEvents.push({
                    actionType: action.actionType as number,
                    accountId: action.accountId,
                    amountSign: positiveAmountSign,
                    amountDenomination: weiDenomination,
                    amountRef: absoluteAmountRef,
                    amountValue: action.conversionRateDenominator.gt(0)
                        ? amount.times(action.conversionRateNumerator).div(action.conversionRateDenominator)
                        : amount,
                    primaryMarketId: marketId,
                    secondaryMarketId: constants.ZERO_AMOUNT,
                    otherAddress: action.actionType === BridgeActionType.Deposit ? from : to,
                    otherAccountId: constants.ZERO_AMOUNT,
                    data: '0x',
                });
            }
            verifyEventsFromLogs(txReceipt.logs, expectedOperateActionEvents, TestDydxBridgeEvents.OperateAction);
        };
        it('succeeds when calling `operate` with the `deposit` action and a single account', async () => {
            const bridgeData = {
                accountNumbers: [defaultAccountNumber],
                actions: [defaultDepositAction],
            };
            await callBridgeTransferFromAndVerifyEvents(accountOwner, receiver, defaultAmount, bridgeData, authorized);
        });
        it('succeeds when calling `operate` with the `deposit` action and multiple accounts', async () => {
            const bridgeData = {
                accountNumbers: [defaultAccountNumber, defaultAccountNumber.plus(1)],
                actions: [defaultDepositAction],
            };
            await callBridgeTransferFromAndVerifyEvents(accountOwner, receiver, defaultAmount, bridgeData, authorized);
        });
        it('succeeds when calling `operate` with the `withdraw` action and a single accuont', async () => {
            const bridgeData = {
                accountNumbers: [defaultAccountNumber],
                actions: [defaultWithdrawAction],
            };
            await callBridgeTransferFromAndVerifyEvents(accountOwner, receiver, defaultAmount, bridgeData, authorized);
        });
        it('succeeds when calling `operate` with the `withdraw` action and multiple accounts', async () => {
            const bridgeData = {
                accountNumbers: [defaultAccountNumber, defaultAccountNumber.plus(1)],
                actions: [defaultWithdrawAction],
            };
            await callBridgeTransferFromAndVerifyEvents(accountOwner, receiver, defaultAmount, bridgeData, authorized);
        });
        it('succeeds when calling `operate` with the `deposit` action and multiple accounts', async () => {
            const bridgeData = {
                accountNumbers: [defaultAccountNumber, defaultAccountNumber.plus(1)],
                actions: [defaultWithdrawAction, defaultDepositAction],
            };
            await callBridgeTransferFromAndVerifyEvents(accountOwner, receiver, defaultAmount, bridgeData, authorized);
        });
        it('succeeds when calling `operate` with multiple actions under a single account', async () => {
            const bridgeData = {
                accountNumbers: [defaultAccountNumber],
                actions: [defaultWithdrawAction, defaultDepositAction],
            };
            await callBridgeTransferFromAndVerifyEvents(accountOwner, receiver, defaultAmount, bridgeData, authorized);
        });
        it('succeeds when scaling the `amount` to deposit', async () => {
            const conversionRateNumerator = new BigNumber(1);
            const conversionRateDenominator = new BigNumber(2);
            const bridgeData = {
                accountNumbers: [defaultAccountNumber],
                actions: [
                    defaultWithdrawAction,
                    {
                        ...defaultDepositAction,
                        conversionRateNumerator,
                        conversionRateDenominator,
                    },
                ],
            };
            await callBridgeTransferFromAndVerifyEvents(accountOwner, receiver, defaultAmount, bridgeData, authorized);
        });
        it('succeeds when scaling the `amount` to withdraw', async () => {
            const conversionRateNumerator = new BigNumber(1);
            const conversionRateDenominator = new BigNumber(2);
            const bridgeData = {
                accountNumbers: [defaultAccountNumber],
                actions: [
                    defaultDepositAction,
                    {
                        ...defaultWithdrawAction,
                        conversionRateNumerator,
                        conversionRateDenominator,
                    },
                ],
            };
            await callBridgeTransferFromAndVerifyEvents(accountOwner, receiver, defaultAmount, bridgeData, authorized);
        });
        it('reverts if not called by the ERC20 Bridge Proxy', async () => {
            const bridgeData = {
                accountNumbers: [defaultAccountNumber],
                actions: [defaultDepositAction],
            };
            const callBridgeTransferFromPromise = callBridgeTransferFrom(
                accountOwner,
                receiver,
                defaultAmount,
                bridgeData,
                notAuthorized,
            );
            const expectedError = RevertReason.DydxBridgeOnlyCallableByErc20BridgeProxy;
            return expect(callBridgeTransferFromPromise).to.revertWith(expectedError);
        });
        it('should return magic bytes if call succeeds', async () => {
            const bridgeData = {
                accountNumbers: [defaultAccountNumber],
                actions: [defaultDepositAction],
            };
            const returnValue = await callBridgeTransferFrom(
                accountOwner,
                receiver,
                defaultAmount,
                bridgeData,
                authorized,
            );
            expect(returnValue).to.equal(AssetProxyId.ERC20Bridge);
        });
    });
});
