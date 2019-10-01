import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    getRandomInteger,
    hexLeftPad,
    hexRandom,
    Numberish,
    randomAddress,
    TransactionHelper,
} from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { DecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    TestEth2DaiBridgeContract,
    TestEth2DaiBridgeEvents,
    TestEth2DaiBridgeSellAllAmountEventArgs,
    TestEth2DaiBridgeTokenApproveEventArgs,
    TestEth2DaiBridgeTokenTransferEventArgs,
} from '../src';

blockchainTests.resets.only('Eth2DaiBridge unit tests', env => {
    const txHelper = new TransactionHelper(env.web3Wrapper, artifacts);
    let testContract: TestEth2DaiBridgeContract;

    before(async () => {
        testContract = await TestEth2DaiBridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestEth2DaiBridge,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('isValidSignature()', () => {
        it('returns success bytes', async () => {
            const LEGACY_WALLET_MAGIC_VALUE = '0xb0671381';
            const result = await testContract.isValidSignature.callAsync(hexRandom(), hexRandom(_.random(0, 32)));
            expect(result).to.eq(LEGACY_WALLET_MAGIC_VALUE);
        });
    });

    describe('withdrawTo()', () => {
        interface WithdrawToOpts {
            toTokenAddress?: string;
            fromTokenAddress?: string;
            toAddress: string;
            amount: Numberish;
            fromTokenBalance: Numberish;
            revertReason: string;
            fillAmount: Numberish;
            toTokentransferRevertReason: string;
            toTokenTransferReturnData: string;
        }

        interface WithdrawToResult {
            opts: WithdrawToOpts;
            result: string;
            logs: DecodedLogs;
        }

        function createWithdrawToOpts(opts?: Partial<WithdrawToOpts>): WithdrawToOpts {
            return {
                toAddress: randomAddress(),
                amount: getRandomInteger(1, 100e18),
                revertReason: '',
                fillAmount: getRandomInteger(1, 100e18),
                fromTokenBalance: getRandomInteger(1, 100e18),
                toTokentransferRevertReason: '',
                toTokenTransferReturnData: hexLeftPad(1),
                ...opts,
            };
        }

        async function withdrawToAsync(opts?: Partial<WithdrawToOpts>): Promise<WithdrawToResult> {
            const _opts = createWithdrawToOpts(opts);
            // Set the fill behavior.
            await testContract.setFillBehavior.awaitTransactionSuccessAsync(
                _opts.revertReason,
                new BigNumber(_opts.fillAmount),
            );
            // Create tokens and balances.
            if (_opts.fromTokenAddress === undefined) {
                [_opts.fromTokenAddress] = await txHelper.getResultAndReceiptAsync(
                    testContract.createToken,
                    new BigNumber(_opts.fromTokenBalance),
                );
            }
            if (_opts.toTokenAddress === undefined) {
                [_opts.toTokenAddress] = await txHelper.getResultAndReceiptAsync(
                    testContract.createToken,
                    constants.ZERO_AMOUNT,
                );
            }
            // Set the transfer behavior of `toTokenAddress`.
            await testContract.setTransferBehavior.awaitTransactionSuccessAsync(
                _opts.toTokenAddress,
                _opts.toTokentransferRevertReason,
                _opts.toTokenTransferReturnData,
            );
            // Call withdrawTo().
            const [result, { logs }] = await txHelper.getResultAndReceiptAsync(
                testContract.withdrawTo,
                // "to" token address
                _opts.toTokenAddress,
                // Random from address.
                randomAddress(),
                // To address.
                _opts.toAddress,
                new BigNumber(_opts.amount),
                // ABI-encode the "from" token address as the bridge data.
                hexLeftPad(_opts.fromTokenAddress as string),
            );
            return {
                opts: _opts,
                result,
                logs: (logs as any) as DecodedLogs,
            };
        }

        it('returns magic bytes on success', async () => {
            const BRIDGE_SUCCESS_RETURN_DATA = AssetProxyId.ERC20Bridge;
            const { result } = await withdrawToAsync();
            expect(result).to.eq(BRIDGE_SUCCESS_RETURN_DATA);
        });

        it('calls `Eth2Dai.sellAllAmount()`', async () => {
            const { opts, logs } = await withdrawToAsync();
            const transfers = filterLogsToArguments<TestEth2DaiBridgeSellAllAmountEventArgs>(
                logs,
                TestEth2DaiBridgeEvents.SellAllAmount,
            );
            expect(transfers.length).to.eq(1);
            expect(transfers[0].sellToken).to.eq(opts.fromTokenAddress);
            expect(transfers[0].buyToken).to.eq(opts.toTokenAddress);
            expect(transfers[0].sellTokenAmount).to.bignumber.eq(opts.fromTokenBalance);
            expect(transfers[0].minimumFillAmount).to.bignumber.eq(opts.amount);
        });

        it('sets an unlimited allowance on the `fromTokenAddress` token', async () => {
            const { opts, logs } = await withdrawToAsync();
            const approvals = filterLogsToArguments<TestEth2DaiBridgeTokenApproveEventArgs>(
                logs,
                TestEth2DaiBridgeEvents.TokenApprove,
            );
            expect(approvals.length).to.eq(1);
            expect(approvals[0].token).to.eq(opts.fromTokenAddress);
            expect(approvals[0].spender).to.eq(testContract.address);
            expect(approvals[0].allowance).to.bignumber.eq(constants.MAX_UINT256);
        });

        it('does not set an unlimited allowance on the `fromTokenAddress` token if already set', async () => {
            const { opts } = await withdrawToAsync();
            const { logs } = await withdrawToAsync({ fromTokenAddress: opts.fromTokenAddress });
            const approvals = filterLogsToArguments<TestEth2DaiBridgeTokenApproveEventArgs>(
                logs,
                TestEth2DaiBridgeEvents.TokenApprove,
            );
            expect(approvals.length).to.eq(0);
        });

        it('transfers filled amount to `to`', async () => {
            const { opts, logs } = await withdrawToAsync();
            const transfers = filterLogsToArguments<TestEth2DaiBridgeTokenTransferEventArgs>(
                logs,
                TestEth2DaiBridgeEvents.TokenTransfer,
            );
            expect(transfers.length).to.eq(1);
            expect(transfers[0].token).to.eq(opts.toTokenAddress);
            expect(transfers[0].from).to.eq(testContract.address);
            expect(transfers[0].to).to.eq(opts.toAddress);
            expect(transfers[0].amount).to.bignumber.eq(opts.fillAmount);
        });

        it('fails if `Eth2Dai.sellAllAmount()` reverts', async () => {
            const opts = createWithdrawToOpts({ revertReason: 'FOOBAR' });
            const tx = withdrawToAsync(opts);
            return expect(tx).to.revertWith(opts.revertReason);
        });

        it('fails if `toTokenAddress.transfer()` reverts', async () => {
            const opts = createWithdrawToOpts({ toTokentransferRevertReason: 'FOOBAR' });
            const tx = withdrawToAsync(opts);
            return expect(tx).to.revertWith(opts.toTokentransferRevertReason);
        });

        it('fails if `toTokenAddress.transfer()` returns falsey', async () => {
            const opts = createWithdrawToOpts({ toTokenTransferReturnData: hexLeftPad(0) });
            const tx = withdrawToAsync(opts);
            return expect(tx).to.revertWith('ERC20_TRANSFER_FAILED');
        });

        it('succeeds if `toTokenAddress.transfer()` returns truthy', async () => {
            await withdrawToAsync({ toTokenTransferReturnData: hexLeftPad(100) });
        });
    });
});
