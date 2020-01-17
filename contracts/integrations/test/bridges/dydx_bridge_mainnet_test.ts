import {
    artifacts as assetProxyArtifacts,
    DydxBridgeActionType,
    DydxBridgeContract,
    DydxBridgeData,
    dydxBridgeDataEncoder,
} from '@0x/contracts-asset-proxy';
import { artifacts as erc20Artifacts } from '@0x/contracts-erc20';
import { blockchainTests, constants, describe, expect, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { DecodedLogArgs, LogWithDecodedArgs } from 'ethereum-types';

import { contractAddresses, dydxAccountOwner } from '../mainnet_fork_utils';

import { dydxEvents } from './abi/dydxEvents';

blockchainTests.fork.skip('Mainnet dydx bridge tests', env => {
    let testContract: DydxBridgeContract;
    // random account to receive tokens from dydx
    const receiver = '0x986ccf5234d9cfbb25246f1a5bfa51f4ccfcb308';
    const defaultAccountNumber = new BigNumber(0);
    const daiMarketId = new BigNumber(3);
    const defaultAmount = toBaseUnitAmount(0.01);
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
        testContract = new DydxBridgeContract(contractAddresses.dydxBridge, env.provider, env.txDefaults, {
            DydxBridge: assetProxyArtifacts.DydxBridge.compilerOutput.abi,
            ERC20: erc20Artifacts.ERC20Token.compilerOutput.abi,
            Dydx: dydxEvents.abi,
        });
    });

    describe('bridgeTransferFrom()', () => {
        const callAndVerifyDydxEvents = async (bridgeData: DydxBridgeData): Promise<void> => {
            const txReceipt = await testContract
                .bridgeTransferFrom(
                    constants.NULL_ADDRESS,
                    dydxAccountOwner,
                    receiver,
                    defaultAmount,
                    dydxBridgeDataEncoder.encode({ bridgeData }),
                )
                .awaitTransactionSuccessAsync({ from: contractAddresses.erc20BridgeProxy, gasPrice: 0 });

            // Construct expected events
            const expectedDepositEvents = [];
            const expectedWithdrawEvents = [];
            for (const action of bridgeData.actions) {
                const scaledAmount = action.conversionRateDenominator.gt(0)
                    ? defaultAmount
                          .times(action.conversionRateNumerator)
                          .dividedToIntegerBy(action.conversionRateDenominator)
                    : defaultAmount;
                switch (action.actionType) {
                    case DydxBridgeActionType.Deposit:
                        expectedDepositEvents.push({
                            accountOwner: dydxAccountOwner,
                            accountNumber: bridgeData.accountNumbers[action.accountId.toNumber()],
                            market: action.marketId,
                            update: [[true, scaledAmount]],
                            from: dydxAccountOwner,
                        });
                        break;

                    case DydxBridgeActionType.Withdraw:
                        expectedWithdrawEvents.push({
                            accountOwner: dydxAccountOwner,
                            accountNumber: bridgeData.accountNumbers[action.accountId.toNumber()],
                            market: action.marketId,
                            update: [[false, scaledAmount]],
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
                // tslint:disable-next-line no-unnecessary-type-assertion
                const log = rawLog as LogWithDecodedArgs<DecodedLogArgs>;
                if (log.event !== 'LogDeposit' && log.event !== 'LogWithdraw') {
                    continue;
                }
                const expectedEvent =
                    log.event === 'LogDeposit'
                        ? expectedDepositEvents[nextExpectedDepositEventIdx++]
                        : expectedWithdrawEvents[nextExpectedWithdrawEventIdx++];
                expect(log.args.accountOwner, 'accountOwner').to.equal(expectedEvent.accountOwner);
                expect(log.args.accountNumber, 'accountNumber').to.bignumber.equal(expectedEvent.accountNumber);
                expect(log.args.market, 'market').to.bignumber.equal(expectedEvent.market);
                expect(log.args.from, 'from').to.equal(expectedEvent.from);
                // We only check the first update field because it's the delta balance (amount deposited).
                // The next field is the new total, which depends on interest rates at the time of execution.
                expect(log.args.update[0][0], 'update sign').to.equal(expectedEvent.update[0][0]);
                const updateValueHex = log.args.update[0][1]._hex;
                const updateValueBn = new BigNumber(updateValueHex, 16);
                expect(updateValueBn, 'update value').to.bignumber.equal(expectedEvent.update[0][1]);
            }
        };

        it('succeeds when calling `operate` with the `deposit` action and a single account', async () => {
            await callAndVerifyDydxEvents({
                accountNumbers: [defaultAccountNumber],
                actions: [defaultDepositAction],
            });
        });
        it('succeeds when calling `operate` with the `deposit` action and multiple accounts', async () => {
            await callAndVerifyDydxEvents({
                accountNumbers: [defaultAccountNumber, defaultAccountNumber.plus(1)],
                actions: [defaultDepositAction],
            });
        });
        it('succeeds when calling `operate` with the `withdraw` action and a single account', async () => {
            await callAndVerifyDydxEvents({
                accountNumbers: [defaultAccountNumber],
                actions: [defaultWithdrawAction],
            });
        });
        it('succeeds when calling `operate` with the `withdraw` action and multiple accounts', async () => {
            await callAndVerifyDydxEvents({
                accountNumbers: [defaultAccountNumber, defaultAccountNumber.plus(1)],
                actions: [defaultWithdrawAction],
            });
        });
        it('succeeds when calling `operate` with the `deposit` action and multiple accounts', async () => {
            await callAndVerifyDydxEvents({
                accountNumbers: [defaultAccountNumber, defaultAccountNumber.plus(1)],
                actions: [defaultWithdrawAction, defaultDepositAction],
            });
        });
        it('succeeds when calling `operate` with multiple actions under a single account', async () => {
            await callAndVerifyDydxEvents({
                accountNumbers: [defaultAccountNumber],
                actions: [defaultWithdrawAction, defaultDepositAction],
            });
        });
    });
});
