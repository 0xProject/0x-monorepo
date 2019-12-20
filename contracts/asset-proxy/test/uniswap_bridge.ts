import {
    blockchainTests,
    constants,
    expect,
    filterLogs,
    filterLogsToArguments,
    getRandomInteger,
    Numberish,
    randomAddress,
} from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';
import { DecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from './artifacts';

import {
    TestUniswapBridgeContract,
    TestUniswapBridgeEthToTokenTransferInputEventArgs as EthToTokenTransferInputArgs,
    TestUniswapBridgeEvents as ContractEvents,
    TestUniswapBridgeTokenApproveEventArgs as TokenApproveArgs,
    TestUniswapBridgeTokenToEthSwapInputEventArgs as TokenToEthSwapInputArgs,
    TestUniswapBridgeTokenToTokenTransferInputEventArgs as TokenToTokenTransferInputArgs,
    TestUniswapBridgeTokenTransferEventArgs as TokenTransferArgs,
    TestUniswapBridgeWethDepositEventArgs as WethDepositArgs,
    TestUniswapBridgeWethWithdrawEventArgs as WethWithdrawArgs,
} from './wrappers';

blockchainTests.resets('UniswapBridge unit tests', env => {
    let testContract: TestUniswapBridgeContract;
    let wethTokenAddress: string;

    before(async () => {
        testContract = await TestUniswapBridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestUniswapBridge,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        wethTokenAddress = await testContract.wethToken().callAsync();
    });

    describe('isValidSignature()', () => {
        it('returns success bytes', async () => {
            const LEGACY_WALLET_MAGIC_VALUE = '0xb0671381';
            const result = await testContract
                .isValidSignature(hexUtils.random(), hexUtils.random(_.random(0, 32)))
                .callAsync();
            expect(result).to.eq(LEGACY_WALLET_MAGIC_VALUE);
        });
    });

    describe('bridgeTransferFrom()', () => {
        interface WithdrawToOpts {
            fromTokenAddress: string;
            toTokenAddress: string;
            fromTokenBalance: Numberish;
            toAddress: string;
            amount: Numberish;
            exchangeRevertReason: string;
            exchangeFillAmount: Numberish;
            toTokenRevertReason: string;
            fromTokenRevertReason: string;
        }

        function createWithdrawToOpts(opts?: Partial<WithdrawToOpts>): WithdrawToOpts {
            return {
                fromTokenAddress: constants.NULL_ADDRESS,
                toTokenAddress: constants.NULL_ADDRESS,
                fromTokenBalance: getRandomInteger(1, 1e18),
                toAddress: randomAddress(),
                amount: getRandomInteger(1, 1e18),
                exchangeRevertReason: '',
                exchangeFillAmount: getRandomInteger(1, 1e18),
                toTokenRevertReason: '',
                fromTokenRevertReason: '',
                ...opts,
            };
        }

        interface WithdrawToResult {
            opts: WithdrawToOpts;
            result: string;
            logs: DecodedLogs;
            blockTime: number;
        }

        async function withdrawToAsync(opts?: Partial<WithdrawToOpts>): Promise<WithdrawToResult> {
            const _opts = createWithdrawToOpts(opts);
            const callData = { value: new BigNumber(_opts.exchangeFillAmount) };
            // Create the "from" token and exchange.
            const createFromTokenFn = testContract.createTokenAndExchange(
                _opts.fromTokenAddress,
                _opts.exchangeRevertReason,
            );
            [_opts.fromTokenAddress] = await createFromTokenFn.callAsync(callData);
            await createFromTokenFn.awaitTransactionSuccessAsync(callData);

            // Create the "to" token and exchange.
            const createToTokenFn = testContract.createTokenAndExchange(
                _opts.toTokenAddress,
                _opts.exchangeRevertReason,
            );
            [_opts.toTokenAddress] = await createToTokenFn.callAsync(callData);
            await createToTokenFn.awaitTransactionSuccessAsync(callData);

            await testContract
                .setTokenRevertReason(_opts.toTokenAddress, _opts.toTokenRevertReason)
                .awaitTransactionSuccessAsync();
            await testContract
                .setTokenRevertReason(_opts.fromTokenAddress, _opts.fromTokenRevertReason)
                .awaitTransactionSuccessAsync();
            // Set the token balance for the token we're converting from.
            await testContract.setTokenBalance(_opts.fromTokenAddress).awaitTransactionSuccessAsync({
                value: new BigNumber(_opts.fromTokenBalance),
            });
            // Call bridgeTransferFrom().
            const bridgeTransferFromFn = testContract.bridgeTransferFrom(
                // The "to" token address.
                _opts.toTokenAddress,
                // The "from" address.
                randomAddress(),
                // The "to" address.
                _opts.toAddress,
                // The amount to transfer to "to"
                new BigNumber(_opts.amount),
                // ABI-encoded "from" token address.
                hexUtils.leftPad(_opts.fromTokenAddress),
            );
            const result = await bridgeTransferFromFn.callAsync();
            const receipt = await bridgeTransferFromFn.awaitTransactionSuccessAsync();
            return {
                opts: _opts,
                result,
                logs: (receipt.logs as any) as DecodedLogs,
                blockTime: await env.web3Wrapper.getBlockTimestampAsync(receipt.blockNumber),
            };
        }

        async function getExchangeForTokenAsync(tokenAddress: string): Promise<string> {
            return testContract.getExchange(tokenAddress).callAsync();
        }

        it('returns magic bytes on success', async () => {
            const { result } = await withdrawToAsync();
            expect(result).to.eq(AssetProxyId.ERC20Bridge);
        });

        it('just transfers tokens to `to` if the same tokens are in play', async () => {
            const createTokenFn = await testContract.createTokenAndExchange(constants.NULL_ADDRESS, '');
            const [tokenAddress] = await createTokenFn.callAsync();
            await createTokenFn.awaitTransactionSuccessAsync();
            const { opts, result, logs } = await withdrawToAsync({
                fromTokenAddress: tokenAddress,
                toTokenAddress: tokenAddress,
            });
            expect(result).to.eq(AssetProxyId.ERC20Bridge);
            const transfers = filterLogsToArguments<TokenTransferArgs>(logs, ContractEvents.TokenTransfer);
            expect(transfers.length).to.eq(1);
            expect(transfers[0].token).to.eq(tokenAddress);
            expect(transfers[0].from).to.eq(testContract.address);
            expect(transfers[0].to).to.eq(opts.toAddress);
            expect(transfers[0].amount).to.bignumber.eq(opts.amount);
        });

        describe('token -> token', () => {
            it('calls `IUniswapExchange.tokenToTokenTransferInput()', async () => {
                const { opts, logs, blockTime } = await withdrawToAsync();
                const exchangeAddress = await getExchangeForTokenAsync(opts.fromTokenAddress);
                const calls = filterLogsToArguments<TokenToTokenTransferInputArgs>(
                    logs,
                    ContractEvents.TokenToTokenTransferInput,
                );
                expect(calls.length).to.eq(1);
                expect(calls[0].exchange).to.eq(exchangeAddress);
                expect(calls[0].tokensSold).to.bignumber.eq(opts.fromTokenBalance);
                expect(calls[0].minTokensBought).to.bignumber.eq(opts.amount);
                expect(calls[0].minEthBought).to.bignumber.eq(1);
                expect(calls[0].deadline).to.bignumber.eq(blockTime);
                expect(calls[0].recipient).to.eq(opts.toAddress);
                expect(calls[0].toTokenAddress).to.eq(opts.toTokenAddress);
            });

            it('sets allowance for "from" token', async () => {
                const { opts, logs } = await withdrawToAsync();
                const approvals = filterLogsToArguments<TokenApproveArgs>(logs, ContractEvents.TokenApprove);
                const exchangeAddress = await getExchangeForTokenAsync(opts.fromTokenAddress);
                expect(approvals.length).to.eq(1);
                expect(approvals[0].spender).to.eq(exchangeAddress);
                expect(approvals[0].allowance).to.bignumber.eq(constants.MAX_UINT256);
            });

            it('sets allowance for "from" token on subsequent calls', async () => {
                const { opts } = await withdrawToAsync();
                const { logs } = await withdrawToAsync(opts);
                const approvals = filterLogsToArguments<TokenApproveArgs>(logs, ContractEvents.TokenApprove);
                const exchangeAddress = await getExchangeForTokenAsync(opts.fromTokenAddress);
                expect(approvals.length).to.eq(1);
                expect(approvals[0].spender).to.eq(exchangeAddress);
                expect(approvals[0].allowance).to.bignumber.eq(constants.MAX_UINT256);
            });

            it('fails if "from" token does not exist', async () => {
                const tx = testContract
                    .bridgeTransferFrom(
                        randomAddress(),
                        randomAddress(),
                        randomAddress(),
                        getRandomInteger(1, 1e18),
                        hexUtils.leftPad(randomAddress()),
                    )
                    .awaitTransactionSuccessAsync();
                return expect(tx).to.eventually.be.rejectedWith('NO_UNISWAP_EXCHANGE_FOR_TOKEN');
            });

            it('fails if the exchange fails', async () => {
                const revertReason = 'FOOBAR';
                const tx = withdrawToAsync({
                    exchangeRevertReason: revertReason,
                });
                return expect(tx).to.eventually.be.rejectedWith(revertReason);
            });
        });

        describe('token -> ETH', () => {
            it('calls `IUniswapExchange.tokenToEthSwapInput()`, `WETH.deposit()`, then `transfer()`', async () => {
                const { opts, logs, blockTime } = await withdrawToAsync({
                    toTokenAddress: wethTokenAddress,
                });
                const exchangeAddress = await getExchangeForTokenAsync(opts.fromTokenAddress);
                let calls: any = filterLogs<TokenToEthSwapInputArgs>(logs, ContractEvents.TokenToEthSwapInput);
                expect(calls.length).to.eq(1);
                expect(calls[0].args.exchange).to.eq(exchangeAddress);
                expect(calls[0].args.tokensSold).to.bignumber.eq(opts.fromTokenBalance);
                expect(calls[0].args.minEthBought).to.bignumber.eq(opts.amount);
                expect(calls[0].args.deadline).to.bignumber.eq(blockTime);
                calls = filterLogs<WethDepositArgs>(
                    logs.slice(calls[0].logIndex as number),
                    ContractEvents.WethDeposit,
                );
                expect(calls.length).to.eq(1);
                expect(calls[0].args.amount).to.bignumber.eq(opts.exchangeFillAmount);
                calls = filterLogs<TokenTransferArgs>(
                    logs.slice(calls[0].logIndex as number),
                    ContractEvents.TokenTransfer,
                );
                expect(calls.length).to.eq(1);
                expect(calls[0].args.token).to.eq(opts.toTokenAddress);
                expect(calls[0].args.from).to.eq(testContract.address);
                expect(calls[0].args.to).to.eq(opts.toAddress);
                expect(calls[0].args.amount).to.bignumber.eq(opts.exchangeFillAmount);
            });

            it('sets allowance for "from" token', async () => {
                const { opts, logs } = await withdrawToAsync({
                    toTokenAddress: wethTokenAddress,
                });
                const transfers = filterLogsToArguments<TokenApproveArgs>(logs, ContractEvents.TokenApprove);
                const exchangeAddress = await getExchangeForTokenAsync(opts.fromTokenAddress);
                expect(transfers.length).to.eq(1);
                expect(transfers[0].spender).to.eq(exchangeAddress);
                expect(transfers[0].allowance).to.bignumber.eq(constants.MAX_UINT256);
            });

            it('sets allowance for "from" token on subsequent calls', async () => {
                const { opts } = await withdrawToAsync({
                    toTokenAddress: wethTokenAddress,
                });
                const { logs } = await withdrawToAsync(opts);
                const approvals = filterLogsToArguments<TokenApproveArgs>(logs, ContractEvents.TokenApprove);
                const exchangeAddress = await getExchangeForTokenAsync(opts.fromTokenAddress);
                expect(approvals.length).to.eq(1);
                expect(approvals[0].spender).to.eq(exchangeAddress);
                expect(approvals[0].allowance).to.bignumber.eq(constants.MAX_UINT256);
            });

            it('fails if "from" token does not exist', async () => {
                const tx = testContract
                    .bridgeTransferFrom(
                        randomAddress(),
                        randomAddress(),
                        randomAddress(),
                        getRandomInteger(1, 1e18),
                        hexUtils.leftPad(wethTokenAddress),
                    )
                    .awaitTransactionSuccessAsync();
                return expect(tx).to.eventually.be.rejectedWith('NO_UNISWAP_EXCHANGE_FOR_TOKEN');
            });

            it('fails if `WETH.deposit()` fails', async () => {
                const revertReason = 'FOOBAR';
                const tx = withdrawToAsync({
                    toTokenAddress: wethTokenAddress,
                    toTokenRevertReason: revertReason,
                });
                return expect(tx).to.eventually.be.rejectedWith(revertReason);
            });

            it('fails if the exchange fails', async () => {
                const revertReason = 'FOOBAR';
                const tx = withdrawToAsync({
                    toTokenAddress: wethTokenAddress,
                    exchangeRevertReason: revertReason,
                });
                return expect(tx).to.eventually.be.rejectedWith(revertReason);
            });
        });

        describe('ETH -> token', () => {
            it('calls  `WETH.withdraw()`, then `IUniswapExchange.ethToTokenTransferInput()`', async () => {
                const { opts, logs, blockTime } = await withdrawToAsync({
                    fromTokenAddress: wethTokenAddress,
                });
                const exchangeAddress = await getExchangeForTokenAsync(opts.toTokenAddress);
                let calls: any = filterLogs<WethWithdrawArgs>(logs, ContractEvents.WethWithdraw);
                expect(calls.length).to.eq(1);
                expect(calls[0].args.amount).to.bignumber.eq(opts.fromTokenBalance);
                calls = filterLogs<EthToTokenTransferInputArgs>(
                    logs.slice(calls[0].logIndex as number),
                    ContractEvents.EthToTokenTransferInput,
                );
                expect(calls.length).to.eq(1);
                expect(calls[0].args.exchange).to.eq(exchangeAddress);
                expect(calls[0].args.minTokensBought).to.bignumber.eq(opts.amount);
                expect(calls[0].args.deadline).to.bignumber.eq(blockTime);
                expect(calls[0].args.recipient).to.eq(opts.toAddress);
            });

            it('does not set any allowance', async () => {
                const { logs } = await withdrawToAsync({
                    fromTokenAddress: wethTokenAddress,
                });
                const approvals = filterLogsToArguments<TokenApproveArgs>(logs, ContractEvents.TokenApprove);
                expect(approvals).to.be.empty('');
            });

            it('fails if "to" token does not exist', async () => {
                const tx = testContract
                    .bridgeTransferFrom(
                        wethTokenAddress,
                        randomAddress(),
                        randomAddress(),
                        getRandomInteger(1, 1e18),
                        hexUtils.leftPad(randomAddress()),
                    )
                    .awaitTransactionSuccessAsync();
                return expect(tx).to.eventually.be.rejectedWith('NO_UNISWAP_EXCHANGE_FOR_TOKEN');
            });

            it('fails if the `WETH.withdraw()` fails', async () => {
                const revertReason = 'FOOBAR';
                const tx = withdrawToAsync({
                    fromTokenAddress: wethTokenAddress,
                    fromTokenRevertReason: revertReason,
                });
                return expect(tx).to.eventually.be.rejectedWith(revertReason);
            });

            it('fails if the exchange fails', async () => {
                const revertReason = 'FOOBAR';
                const tx = withdrawToAsync({
                    fromTokenAddress: wethTokenAddress,
                    exchangeRevertReason: revertReason,
                });
                return expect(tx).to.eventually.be.rejectedWith(revertReason);
            });
        });
    });
});
