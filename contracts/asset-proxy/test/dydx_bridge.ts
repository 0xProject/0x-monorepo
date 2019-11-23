import { blockchainTests, constants, expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { AuthorizableRevertErrors } from '@0x/contracts-utils';
import { AssetProxyId } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { TestDydxBridgeContract, TestDydxBridgeEvents } from './wrappers';

blockchainTests.resets('DydxBridge unit tests', env => {
    const accountNumber = new BigNumber(1);
    const marketId = new BigNumber(2);
    let testContract: TestDydxBridgeContract;
    let owner: string;
    let authorized: string;
    let notAuthorized: string;
    let accountOwner: string;
    let accountOperator: string;
    let notAccountOwnerNorOperator: string;
    let receiver: string;

    before(async () => {
        // Get accounts
        const accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        [
            owner,
            authorized,
            notAuthorized,
            accountOwner,
            accountOperator,
            notAccountOwnerNorOperator,
            receiver,
        ] = accounts;

        // Deploy dydx bridge
        testContract = await TestDydxBridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestDydxBridge,
            env.provider,
            env.txDefaults,
            artifacts,
            accountOperator,
        );

        // Authorize `authorized` account on `testContract`.
        await testContract.addAuthorizedAddress(authorized).awaitTransactionSuccessAsync({ from: owner });
    });

    describe('bridgeTransferFrom()', () => {
        interface BridgeData {
            action: number;
            accountOwner: string;
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
            bridgeData: BridgeData,
            sender: string,
        ): Promise<string> => {
            const returnValue = await testContract
                .bridgeTransferFrom(
                    constants.NULL_ADDRESS,
                    from,
                    receiver,
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
            bridgeData: BridgeData,
            sender: string,
        ): Promise<void> => {
            // Execute transaction.
            const txReceipt = await testContract
                .bridgeTransferFrom(
                    constants.NULL_ADDRESS,
                    from,
                    receiver,
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
                accountOwner,
                accountNumber,
                marketId,
            };

            // Create encoder for bridge data
            bridgeDataEncoder = AbiEncoder.create([
                { name: 'action', type: 'uint8' },
                { name: 'accountOwner', type: 'address' },
                { name: 'accountNumber', type: 'uint256' },
                { name: 'marketId', type: 'uint256' },
            ]);
        });
        it('succeeds if `from` owns the dydx account', async () => {
            await callBridgeTransferFrom(accountOwner, defaultBridgeData, authorized);
        });
        it('succeeds if `from` operates the dydx account', async () => {
            await callBridgeTransferFrom(accountOperator, defaultBridgeData, authorized);
        });
        it('reverts if `from` is neither the owner nor the operator of the dydx account', async () => {
            const tx = callBridgeTransferFrom(notAccountOwnerNorOperator, defaultBridgeData, authorized);
            const expectedError = 'INVALID_DYDX_OWNER_OR_OPERATOR';
            return expect(tx).to.revertWith(expectedError);
        });
        it('succeeds when calling `operate` with the `deposit` action', async () => {
            const depositAction = 0;
            const depositFrom = accountOwner;
            const bridgeData = {
                ...defaultBridgeData,
                action: depositAction,
            };
            await callBridgeTransferFromAndVerifyEvents(
                depositAction,
                depositFrom,
                accountOwner,
                bridgeData,
                authorized,
            );
        });
        it('succeeds when calling `operate` with the `withdraw` action', async () => {
            const withdrawAction = 1;
            const withdrawTo = receiver;
            const bridgeData = {
                ...defaultBridgeData,
                action: withdrawAction,
            };
            await callBridgeTransferFromAndVerifyEvents(
                withdrawAction,
                withdrawTo,
                accountOwner,
                bridgeData,
                authorized,
            );
        });
        it('reverts if called by an unauthorized account', async () => {
            const callBridgeTransferFromPromise = callBridgeTransferFrom(
                accountOwner,
                defaultBridgeData,
                notAuthorized,
            );
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notAuthorized);
            return expect(callBridgeTransferFromPromise).to.revertWith(expectedError);
        });
        it('should return magic bytes if call succeeds', async () => {
            const returnValue = await callBridgeTransferFrom(accountOwner, defaultBridgeData, authorized);
            expect(returnValue).to.equal(AssetProxyId.ERC20Bridge);
        });
    });
});
