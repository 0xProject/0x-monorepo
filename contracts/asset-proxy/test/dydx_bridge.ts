import { blockchainTests, constants, expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { AssetProxyId, RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { DydxBridgeActionType, DydxBridgeData, dydxBridgeDataEncoder } from '../src/dydx_bridge_encoder';
import { ERC20BridgeProxyContract, IAssetDataContract } from '../src/wrappers';

import { artifacts } from './artifacts';
import { TestDydxBridgeContract, TestDydxBridgeEvents } from './wrappers';

blockchainTests.resets('DydxBridge unit tests', env => {
    const defaultAccountNumber = new BigNumber(1);
    const marketId = new BigNumber(2);
    const defaultAmount = new BigNumber(4);
    const notAuthorized = '0x0000000000000000000000000000000000000001';
    const defaultDepositAction = {
        actionType: DydxBridgeActionType.Deposit,
        accountId: constants.ZERO_AMOUNT,
        marketId,
        conversionRateNumerator: constants.ZERO_AMOUNT,
        conversionRateDenominator: constants.ZERO_AMOUNT,
    };
    const defaultWithdrawAction = {
        actionType: DydxBridgeActionType.Withdraw,
        accountId: constants.ZERO_AMOUNT,
        marketId,
        conversionRateNumerator: constants.ZERO_AMOUNT,
        conversionRateDenominator: constants.ZERO_AMOUNT,
    };
    let testContract: TestDydxBridgeContract;
    let testProxyContract: ERC20BridgeProxyContract;
    let assetDataEncoder: IAssetDataContract;
    let owner: string;
    let authorized: string;
    let accountOwner: string;
    let receiver: string;

    before(async () => {
        // Get accounts
        const accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        [owner, authorized, accountOwner, receiver] = accounts;

        // Deploy dydx bridge
        testContract = await TestDydxBridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestDydxBridge,
            env.provider,
            env.txDefaults,
            artifacts,
            [accountOwner, receiver],
        );

        // Deploy test erc20 bridge proxy
        testProxyContract = await ERC20BridgeProxyContract.deployFrom0xArtifactAsync(
            artifacts.ERC20BridgeProxy,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        await testProxyContract.addAuthorizedAddress(authorized).awaitTransactionSuccessAsync({ from: owner });

        // Setup asset data encoder
        assetDataEncoder = new IAssetDataContract(constants.NULL_ADDRESS, env.provider);
    });

    describe('bridgeTransferFrom()', () => {
        const callBridgeTransferFrom = async (
            from: string,
            to: string,
            amount: BigNumber,
            bridgeData: DydxBridgeData,
            sender: string,
        ): Promise<string> => {
            const returnValue = await testContract
                .bridgeTransferFrom(
                    constants.NULL_ADDRESS,
                    from,
                    to,
                    amount,
                    dydxBridgeDataEncoder.encode({ bridgeData }),
                )
                .callAsync({ from: sender });
            return returnValue;
        };
        const callBridgeTransferFromAndVerifyEvents = async (
            from: string,
            to: string,
            amount: BigNumber,
            bridgeData: DydxBridgeData,
            sender: string,
        ): Promise<void> => {
            // Execute transaction.
            const txReceipt = await testContract
                .bridgeTransferFrom(
                    constants.NULL_ADDRESS,
                    from,
                    to,
                    amount,
                    dydxBridgeDataEncoder.encode({ bridgeData }),
                )
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
            const weiDenomination = 0;
            const deltaAmountRef = 0;
            const expectedOperateActionEvents = [];
            for (const action of bridgeData.actions) {
                expectedOperateActionEvents.push({
                    actionType: action.actionType as number,
                    accountId: action.accountId,
                    amountSign: action.actionType === DydxBridgeActionType.Deposit ? true : false,
                    amountDenomination: weiDenomination,
                    amountRef: deltaAmountRef,
                    amountValue: action.conversionRateDenominator.gt(0)
                        ? amount
                              .times(action.conversionRateNumerator)
                              .dividedToIntegerBy(action.conversionRateDenominator)
                        : amount,
                    primaryMarketId: marketId,
                    secondaryMarketId: constants.ZERO_AMOUNT,
                    otherAddress: action.actionType === DydxBridgeActionType.Deposit ? from : to,
                    otherAccountId: constants.ZERO_AMOUNT,
                    data: '0x',
                });
            }
            verifyEventsFromLogs(txReceipt.logs, expectedOperateActionEvents, TestDydxBridgeEvents.OperateAction);
        };
        it('succeeds when calling with zero amount', async () => {
            const bridgeData = {
                accountNumbers: [defaultAccountNumber],
                actions: [defaultDepositAction],
            };
            await callBridgeTransferFromAndVerifyEvents(
                accountOwner,
                receiver,
                constants.ZERO_AMOUNT,
                bridgeData,
                authorized,
            );
        });
        it('succeeds when calling with no accounts', async () => {
            const bridgeData = {
                accountNumbers: [],
                actions: [defaultDepositAction],
            };
            await callBridgeTransferFromAndVerifyEvents(accountOwner, receiver, defaultAmount, bridgeData, authorized);
        });
        it('succeeds when calling with no actions', async () => {
            const bridgeData = {
                accountNumbers: [defaultAccountNumber],
                actions: [],
            };
            await callBridgeTransferFromAndVerifyEvents(accountOwner, receiver, defaultAmount, bridgeData, authorized);
        });
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
        it('succeeds when calling `operate` with the `withdraw` action and a single account', async () => {
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
        it('should revert when `Operate` reverts', async () => {
            // Set revert flag.
            await testContract.setRevertOnOperate(true).awaitTransactionSuccessAsync();

            // Execute transfer.
            const bridgeData = {
                accountNumbers: [defaultAccountNumber],
                actions: [defaultDepositAction],
            };
            const tx = callBridgeTransferFrom(accountOwner, receiver, defaultAmount, bridgeData, authorized);
            const expectedError = 'TestDydxBridge/SHOULD_REVERT_ON_OPERATE';
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('ERC20BridgeProxy.transferFrom()', () => {
        const bridgeData = {
            accountNumbers: [defaultAccountNumber],
            actions: [defaultWithdrawAction],
        };
        let assetData: string;

        before(async () => {
            const testTokenAddress = await testContract.getTestToken().callAsync();
            assetData = assetDataEncoder
                .ERC20Bridge(testTokenAddress, testContract.address, dydxBridgeDataEncoder.encode({ bridgeData }))
                .getABIEncodedTransactionData();
        });

        it('should succeed if `bridgeTransferFrom` succeeds', async () => {
            await testProxyContract
                .transferFrom(assetData, accountOwner, receiver, defaultAmount)
                .awaitTransactionSuccessAsync({ from: authorized });
        });
        it('should revert if `bridgeTransferFrom` reverts', async () => {
            // Set revert flag.
            await testContract.setRevertOnOperate(true).awaitTransactionSuccessAsync();
            const tx = testProxyContract
                .transferFrom(assetData, accountOwner, receiver, defaultAmount)
                .awaitTransactionSuccessAsync({ from: authorized });
            const expectedError = 'TestDydxBridge/SHOULD_REVERT_ON_OPERATE';
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
