import { dydxBridgeDataEncoder, DydxBridgeActionType, DydxBridgeContract, DydxBridgeData, artifacts as assetProxyArtifacts, ERC20BridgeProxyContract } from '@0x/contracts-asset-proxy';
import { StakingProxyContract, ZrxVaultContract, artifacts as stakingArtifacts } from '@0x/contracts-staking';
import { blockchainTests, constants, describe, expect, toBaseUnitAmount, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { assetDataUtils } from '@0x/order-utils';
import { artifacts as erc20Artifacts } from '@0x/contracts-erc20';
import { LogWithDecodedArgs, DecodedLogArgs, LogEntry } from 'ethereum-types';

import { contractAddresses, contractWrappers } from '../mainnet_fork_utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-protocol';

import { DeploymentManager } from '../framework/deployment_manager';

import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { Actor } from '../framework/actors/base';

import { dydxEvents }  from './abi/dydxEvents';

blockchainTests.resets.fork('Mainnet dydx bridge tests', env => {
    let testContract: DydxBridgeContract;
    let testProxyContract: ERC20BridgeProxyContract;
    const accountOwner = '0x1916a90bafe25771485e182a96132e200daffdd1'; // me
    const receiver = '0x986ccf5234d9cfbb25246f1a5bfa51f4ccfcb308';
    const dydxBridgeAddress = '0x96ddba19b69d6ea2549f6a12d005595167414744';
    const erc20BridgeProxyAddress = '0x8ed95d1746bf1e4dab58d8ed4724f1ef95b20db0';
    const defaultAccountNumber = new BigNumber(0);
    const daiMarketId = new BigNumber(3);
    const defaultDepositAction = {
        actionType: DydxBridgeActionType.Deposit as number,
        accountId: constants.ZERO_AMOUNT,
        marketId: daiMarketId,
        conversionRateNumerator: constants.ZERO_AMOUNT,
        conversionRateDenominator: constants.ZERO_AMOUNT,
    };
    const defaultWithdrawAction = {
        actionType: DydxBridgeActionType.Withdraw as number,
        accountId: constants.ZERO_AMOUNT,
        marketId: daiMarketId,
        // This ratio must be less than the `1` to account
        // for interest in dydx balances because the test
        // account has an initial dydx balance of zero.
        conversionRateNumerator: new BigNumber(1),
        conversionRateDenominator: new BigNumber(2),
    };
    before(async () => {
        testContract = new DydxBridgeContract(dydxBridgeAddress, env.provider, env.txDefaults, {"DydxBridge" : assetProxyArtifacts.DydxBridge.compilerOutput.abi, "ERC20": erc20Artifacts.ERC20Token.compilerOutput.abi, "Dydx": dydxEvents.abi});
    });

    describe('bridgeTransferFrom()', () => {
        const callAndVerifyDydxEvents = async (
            from: string,
            to: string,
            amount: BigNumber,
            bridgeData: DydxBridgeData,
            sender: string,
        ): Promise<void> => {
            const txReceipt = await testContract
                .bridgeTransferFrom(constants.NULL_ADDRESS, from, to, amount, dydxBridgeDataEncoder.encode({ bridgeData }))
                .awaitTransactionSuccessAsync({ from: sender, gasPrice: 0 });

            console.log(JSON.stringify(txReceipt.logs, null, 4));

            // Construct expected events
            const expectedDepositEvents = [];
            const expectedWithdrawEvents = [];
            for (const action of bridgeData.actions) {
                const scaledAmount = action.conversionRateDenominator.gt(0)
                    ? amount.times(action.conversionRateNumerator).dividedToIntegerBy(action.conversionRateDenominator)
                    : amount;
                switch (action.actionType) {
                    case DydxBridgeActionType.Deposit:

                        expectedDepositEvents.push({
                            accountOwner,
                            accountNumber: bridgeData.accountNumbers[action.accountId.toNumber()],
                            market: action.marketId,
                            update: [
                                [
                                    true,
                                    scaledAmount,
                                ]
                            ],
                            from: accountOwner,
                        });
                        break;

                    case DydxBridgeActionType.Withdraw:
                            expectedWithdrawEvents.push({
                                accountOwner,
                                accountNumber: bridgeData.accountNumbers[action.accountId.toNumber()],
                                market: action.marketId,
                                update: [
                                    [
                                        false,
                                        scaledAmount,
                                    ]
                                ],
                                to: receiver,
                            });
                        break;

                    default:
                        throw new Error(`Unrecognized Action: ${action.actionType}`);
                }
            }

            // Verify events
            let nextExpectedDepositEventIdx = 0;
            let nextExpectedWithdrawEventIdx = 0;
            for (const rawLog of txReceipt.logs) {
                const log = rawLog as LogWithDecodedArgs<DecodedLogArgs>;
                if (log.event !== 'LogDeposit' && log.event !== 'LogWithdraw') {
                    continue;
                }
                const expectedEvent = (log.event === 'LogDeposit') ? expectedDepositEvents[nextExpectedDepositEventIdx++] : expectedWithdrawEvents[nextExpectedWithdrawEventIdx++];
                expect(expectedEvent.accountOwner, 'accountOwner').to.equal(log.args.accountOwner);
                expect(expectedEvent.accountNumber, 'accountNumber').to.bignumber.equal(log.args.accountNumber);
                expect(expectedEvent.market, 'market').to.bignumber.equal(log.args.market);
                expect(expectedEvent.from, 'from').to.equal(log.args.from);
                // We only check the first update field because it's the delta balance (amount deposited).
                // The next field is the new total, which depends on interest rates at the time of execution.
                expect(expectedEvent.update[0][0], 'update sign').to.equal(log.args.update[0][0]);
                const updateValueHex = log.args.update[0][1]._hex;
                const updateValueBn = new BigNumber(updateValueHex, 16);
                expect(expectedEvent.update[0][1], 'update value').to.bignumber.equal(updateValueBn);
            }
        };




        it('should successfully deposit value', async () => {
            const bridgeData = {
                accountNumbers: [defaultAccountNumber],
                actions: [defaultDepositAction, defaultWithdrawAction],
            };
            const returnValue = await callAndVerifyDydxEvents(
                accountOwner,
                receiver,
                toBaseUnitAmount(1),
                bridgeData,
                erc20BridgeProxyAddress
            );
            console.log(JSON.stringify(returnValue, null, 4));
        });


        /*
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
        */



    });
});
