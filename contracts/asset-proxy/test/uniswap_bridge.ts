import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    getRandomInteger,
    hexRandom,
    Numberish,
    randomAddress,
    TransactionHelper,
} from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { DecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    TestUniswapBridgeContract,
    TestUniswapBridgeEvents,
    TestUniswapBridgeSellAllAmountEventArgs,
    TestUniswapBridgeTokenTransferEventArgs,
} from '../src';

blockchainTests.resets('UniswapBridge unit tests', env => {
    const txHelper = new TransactionHelper(env.web3Wrapper, artifacts);
    let testContract: TestUniswapBridgeContract;
    let daiTokenAddress: string;
    let wethTokenAddress: string;

    before(async () => {
        testContract = await TestUniswapBridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestUniswapBridge,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        [daiTokenAddress, wethTokenAddress] = await Promise.all([
            testContract.daiToken.callAsync(),
            testContract.wethToken.callAsync(),
        ]);
    });

    describe('deployment', () => {
        it('sets Uniswap allowances to maximum', async () => {
            const [wethAllowance, daiAllowance] = await testContract.getUniswapTokenAllowances.callAsync();
            expect(wethAllowance).to.bignumber.eq(constants.MAX_UINT256);
            expect(daiAllowance).to.bignumber.eq(constants.MAX_UINT256);
        });
    });

    describe('isValidSignature()', () => {
        it('returns success bytes', async () => {
            const LEGACY_WALLET_MAGIC_VALUE = '0xb0671381';
            const result = await testContract.isValidSignature.callAsync(hexRandom(), hexRandom(_.random(0, 32)));
            expect(result).to.eq(LEGACY_WALLET_MAGIC_VALUE);
        });
    });

    describe('transfer()', () => {
        interface TransferOpts {
            toTokenAddress: string;
            toAddress: string;
            amount: Numberish;
            fromTokenBalance: Numberish;
            revertReason: string;
            fillAmount: Numberish;
        }

        function createTransferOpts(opts?: Partial<TransferOpts>): TransferOpts {
            return {
                toTokenAddress: _.sampleSize([wethTokenAddress, daiTokenAddress], 1)[0],
                toAddress: randomAddress(),
                amount: getRandomInteger(1, 100e18),
                revertReason: '',
                fillAmount: getRandomInteger(1, 100e18),
                fromTokenBalance: getRandomInteger(1, 100e18),
                ...opts,
            };
        }

        async function transferAsync(opts?: Partial<TransferOpts>): Promise<[string, DecodedLogs]> {
            const _opts = createTransferOpts(opts);
            // Set the fill behavior.
            await testContract.setFillBehavior.awaitTransactionSuccessAsync(
                _opts.revertReason,
                new BigNumber(_opts.fillAmount),
            );
            // Set the token balance for the token we're converting from.
            await testContract.setTokenBalances.awaitTransactionSuccessAsync(
                _opts.toTokenAddress === daiTokenAddress
                    ? new BigNumber(_opts.fromTokenBalance)
                    : constants.ZERO_AMOUNT,
                _opts.toTokenAddress === wethTokenAddress
                    ? new BigNumber(_opts.fromTokenBalance)
                    : constants.ZERO_AMOUNT,
            );
            // Call transfer().
            const [result, { logs }] = await txHelper.getResultAndReceiptAsync(
                testContract.transfer,
                '0x',
                _opts.toTokenAddress,
                randomAddress(),
                _opts.toAddress,
                new BigNumber(_opts.amount),
            );
            return [result, (logs as any) as DecodedLogs];
        }

        function getOppositeToken(tokenAddress: string): string {
            if (tokenAddress === daiTokenAddress) {
                return wethTokenAddress;
            }
            return daiTokenAddress;
        }

        it('returns magic bytes on success', async () => {
            const BRIDGE_SUCCESS_RETURN_DATA = '0xb5d40d78';
            const [result] = await transferAsync();
            expect(result).to.eq(BRIDGE_SUCCESS_RETURN_DATA);
        });

        it('calls `Uniswap.sellAllAmount()`', async () => {
            const opts = createTransferOpts();
            const [, logs] = await transferAsync(opts);
            const transfers = filterLogsToArguments<TestUniswapBridgeSellAllAmountEventArgs>(
                logs,
                TestUniswapBridgeEvents.SellAllAmount,
            );
            expect(transfers.length).to.eq(1);
            expect(transfers[0].sellToken).to.eq(getOppositeToken(opts.toTokenAddress));
            expect(transfers[0].buyToken).to.eq(opts.toTokenAddress);
            expect(transfers[0].sellTokenAmount).to.bignumber.eq(opts.fromTokenBalance);
            expect(transfers[0].minimumFillAmount).to.bignumber.eq(opts.amount);
        });

        it('can swap DAI for WETH', async () => {
            const opts = createTransferOpts({ toTokenAddress: wethTokenAddress });
            const [, logs] = await transferAsync(opts);
            const transfers = filterLogsToArguments<TestUniswapBridgeSellAllAmountEventArgs>(
                logs,
                TestUniswapBridgeEvents.SellAllAmount,
            );
            expect(transfers.length).to.eq(1);
            expect(transfers[0].sellToken).to.eq(daiTokenAddress);
            expect(transfers[0].buyToken).to.eq(wethTokenAddress);
        });

        it('can swap WETH for DAI', async () => {
            const opts = createTransferOpts({ toTokenAddress: daiTokenAddress });
            const [, logs] = await transferAsync(opts);
            const transfers = filterLogsToArguments<TestUniswapBridgeSellAllAmountEventArgs>(
                logs,
                TestUniswapBridgeEvents.SellAllAmount,
            );
            expect(transfers.length).to.eq(1);
            expect(transfers[0].sellToken).to.eq(wethTokenAddress);
            expect(transfers[0].buyToken).to.eq(daiTokenAddress);
        });

        it('transfers filled amount to `to`', async () => {
            const opts = createTransferOpts();
            const [, logs] = await transferAsync(opts);
            const transfers = filterLogsToArguments<TestUniswapBridgeTokenTransferEventArgs>(
                logs,
                TestUniswapBridgeEvents.TokenTransfer,
            );
            expect(transfers.length).to.eq(1);
            expect(transfers[0].token).to.eq(opts.toTokenAddress);
            expect(transfers[0].from).to.eq(testContract.address);
            expect(transfers[0].to).to.eq(opts.toAddress);
            expect(transfers[0].amount).to.bignumber.eq(opts.fillAmount);
        });

        it('fails if `Uniswap.sellAllAmount()` reverts', async () => {
            const opts = createTransferOpts({ revertReason: 'FOOBAR' });
            const tx = transferAsync(opts);
            return expect(tx).to.revertWith(opts.revertReason);
        });
    });
});
