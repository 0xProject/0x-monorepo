import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber, hexLeftPad, hexRandom } from '@0x/utils';
import { DecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from './artifacts';

import { TestKyberBridgeContract, TestKyberBridgeEvents } from './wrappers';

blockchainTests.resets('KyberBridge unit tests', env => {
    const KYBER_ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    let testContract: TestKyberBridgeContract;

    before(async () => {
        testContract = await TestKyberBridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestKyberBridge,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('isValidSignature()', () => {
        it('returns success bytes', async () => {
            const LEGACY_WALLET_MAGIC_VALUE = '0xb0671381';
            const result = await testContract.isValidSignature(hexRandom(), hexRandom(_.random(0, 32))).callAsync();
            expect(result).to.eq(LEGACY_WALLET_MAGIC_VALUE);
        });
    });

    describe('bridgeTransferFrom()', () => {
        let fromTokenAddress: string;
        let toTokenAddress: string;
        let wethAddress: string;

        before(async () => {
            wethAddress = await testContract.weth().callAsync();
            fromTokenAddress = await testContract.createToken().callAsync();
            await testContract.createToken().awaitTransactionSuccessAsync();
            toTokenAddress = await testContract.createToken().callAsync();
            await testContract.createToken().awaitTransactionSuccessAsync();
        });

        const STATIC_KYBER_TRADE_ARGS = {
            maxBuyTokenAmount: constants.MAX_UINT256,
            walletId: constants.NULL_ADDRESS,
        };

        interface TransferFromOpts {
            toTokenAddress: string;
            fromTokenAddress: string;
            toAddress: string;
            // Amount to pass into `bridgeTransferFrom()`
            amount: BigNumber;
            // Amount to convert in `trade()`.
            fillAmount: BigNumber;
            // Token balance of the bridge.
            fromTokenBalance: BigNumber;
        }

        interface TransferFromResult {
            opts: TransferFromOpts;
            result: string;
            logs: DecodedLogs;
        }

        function createTransferFromOpts(opts?: Partial<TransferFromOpts>): TransferFromOpts {
            return {
                fromTokenAddress,
                toTokenAddress,
                toAddress: randomAddress(),
                amount: getRandomInteger(1, 10e18),
                fillAmount: getRandomInteger(1, 10e18),
                fromTokenBalance: getRandomInteger(1, 10e18),
                ...opts,
            };
        }

        async function withdrawToAsync(opts?: Partial<TransferFromOpts>): Promise<TransferFromResult> {
            const _opts = createTransferFromOpts(opts);
            // Fund the contract with input tokens.
            await testContract
                .grantTokensTo(_opts.fromTokenAddress, testContract.address, _opts.fromTokenBalance)
                .awaitTransactionSuccessAsync({ value: _opts.fromTokenBalance });
            // Fund the contract with output tokens.
            await testContract.setNextFillAmount(_opts.fillAmount).awaitTransactionSuccessAsync({
                value: _opts.toTokenAddress === wethAddress ? _opts.fillAmount : constants.ZERO_AMOUNT,
            });
            // Call bridgeTransferFrom().
            const bridgeTransferFromFn = testContract.bridgeTransferFrom(
                // Output token
                _opts.toTokenAddress,
                // Random maker address.
                randomAddress(),
                // Recipient address.
                _opts.toAddress,
                // Transfer amount.
                _opts.amount,
                // ABI-encode the input token address as the bridge data.
                hexLeftPad(_opts.fromTokenAddress),
            );
            const result = await bridgeTransferFromFn.callAsync();
            const { logs } = await bridgeTransferFromFn.awaitTransactionSuccessAsync();
            return {
                opts: _opts,
                result,
                logs: (logs as any) as DecodedLogs,
            };
        }

        function getMinimumConversionRate(opts: TransferFromOpts): BigNumber {
            return opts.amount
                .times(constants.ONE_ETHER)
                .div(opts.fromTokenBalance)
                .integerValue(BigNumber.ROUND_DOWN);
        }

        it('returns magic bytes on success', async () => {
            const BRIDGE_SUCCESS_RETURN_DATA = AssetProxyId.ERC20Bridge;
            const { result } = await withdrawToAsync();
            expect(result).to.eq(BRIDGE_SUCCESS_RETURN_DATA);
        });

        it('can trade token -> token', async () => {
            const { opts, logs } = await withdrawToAsync();
            verifyEventsFromLogs(
                logs,
                [
                    {
                        sellTokenAddress: opts.fromTokenAddress,
                        buyTokenAddress: opts.toTokenAddress,
                        sellAmount: opts.fromTokenBalance,
                        recipientAddress: opts.toAddress,
                        minConversionRate: getMinimumConversionRate(opts),
                        msgValue: constants.ZERO_AMOUNT,
                        ...STATIC_KYBER_TRADE_ARGS,
                    },
                ],
                TestKyberBridgeEvents.KyberBridgeTrade,
            );
        });

        it('can trade token -> ETH', async () => {
            const { opts, logs } = await withdrawToAsync({
                toTokenAddress: wethAddress,
            });
            verifyEventsFromLogs(
                logs,
                [
                    {
                        sellTokenAddress: opts.fromTokenAddress,
                        buyTokenAddress: KYBER_ETH_ADDRESS,
                        sellAmount: opts.fromTokenBalance,
                        recipientAddress: testContract.address,
                        minConversionRate: getMinimumConversionRate(opts),
                        msgValue: constants.ZERO_AMOUNT,
                        ...STATIC_KYBER_TRADE_ARGS,
                    },
                ],
                TestKyberBridgeEvents.KyberBridgeTrade,
            );
        });

        it('can trade ETH -> token', async () => {
            const { opts, logs } = await withdrawToAsync({
                fromTokenAddress: wethAddress,
            });
            verifyEventsFromLogs(
                logs,
                [
                    {
                        sellTokenAddress: KYBER_ETH_ADDRESS,
                        buyTokenAddress: opts.toTokenAddress,
                        sellAmount: opts.fromTokenBalance,
                        recipientAddress: opts.toAddress,
                        minConversionRate: getMinimumConversionRate(opts),
                        msgValue: opts.fromTokenBalance,
                        ...STATIC_KYBER_TRADE_ARGS,
                    },
                ],
                TestKyberBridgeEvents.KyberBridgeTrade,
            );
        });

        it('does nothing if bridge has no token balance', async () => {
            const { logs } = await withdrawToAsync({
                fromTokenBalance: constants.ZERO_AMOUNT,
            });
            expect(logs).to.be.length(0);
        });

        it('only transfers the token if trading the same token', async () => {
            const { opts, logs } = await withdrawToAsync({
                toTokenAddress: fromTokenAddress,
            });
            verifyEventsFromLogs(
                logs,
                [
                    {
                        tokenAddress: fromTokenAddress,
                        ownerAddress: testContract.address,
                        recipientAddress: opts.toAddress,
                        amount: opts.fromTokenBalance,
                    },
                ],
                TestKyberBridgeEvents.KyberBridgeTokenTransfer,
            );
        });

        it('grants Kyber an allowance when selling non-WETH', async () => {
            const { opts, logs } = await withdrawToAsync();
            verifyEventsFromLogs(
                logs,
                [
                    {
                        tokenAddress: opts.fromTokenAddress,
                        ownerAddress: testContract.address,
                        spenderAddress: testContract.address,
                        allowance: constants.MAX_UINT256,
                    },
                ],
                TestKyberBridgeEvents.KyberBridgeTokenApprove,
            );
        });

        it('does not grant Kyber an allowance when selling WETH', async () => {
            const { logs } = await withdrawToAsync({
                fromTokenAddress: wethAddress,
            });
            verifyEventsFromLogs(logs, [], TestKyberBridgeEvents.KyberBridgeTokenApprove);
        });

        it('withdraws WETH and passes it to Kyber when selling WETH', async () => {
            const { opts, logs } = await withdrawToAsync({
                fromTokenAddress: wethAddress,
            });
            expect(logs[0].event).to.eq(TestKyberBridgeEvents.KyberBridgeWethWithdraw);
            expect(logs[0].args).to.deep.eq({
                ownerAddress: testContract.address,
                amount: opts.fromTokenBalance,
            });
            expect(logs[1].event).to.eq(TestKyberBridgeEvents.KyberBridgeTrade);
            expect(logs[1].args.msgValue).to.bignumber.eq(opts.fromTokenBalance);
        });

        it('wraps WETH and transfers it to the recipient when buyng WETH', async () => {
            const { opts, logs } = await withdrawToAsync({
                toTokenAddress: wethAddress,
            });
            expect(logs[0].event).to.eq(TestKyberBridgeEvents.KyberBridgeTokenApprove);
            expect(logs[0].args.tokenAddress).to.eq(opts.fromTokenAddress);
            expect(logs[1].event).to.eq(TestKyberBridgeEvents.KyberBridgeTrade);
            expect(logs[1].args.recipientAddress).to.eq(testContract.address);
            expect(logs[2].event).to.eq(TestKyberBridgeEvents.KyberBridgeWethDeposit);
            expect(logs[2].args).to.deep.eq({
                msgValue: opts.fillAmount,
                ownerAddress: testContract.address,
                amount: opts.fillAmount,
            });
        });
    });
});
