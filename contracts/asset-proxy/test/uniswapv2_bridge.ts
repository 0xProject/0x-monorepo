import {
    blockchainTests,
    constants,
    expect,
    filterLogsToArguments,
    getRandomInteger,
    randomAddress,
} from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { AbiEncoder, BigNumber, hexUtils } from '@0x/utils';
import { DecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from './artifacts';

import {
    TestUniswapV2BridgeContract,
    TestUniswapV2BridgeEvents as ContractEvents,
    TestUniswapV2BridgeSwapExactTokensForTokensInputEventArgs as SwapExactTokensForTokensArgs,
    TestUniswapV2BridgeTokenApproveEventArgs as TokenApproveArgs,
    TestUniswapV2BridgeTokenTransferEventArgs as TokenTransferArgs,
} from './wrappers';

blockchainTests.resets('UniswapV2 unit tests', env => {
    const FROM_TOKEN_DECIMALS = 6;
    const TO_TOKEN_DECIMALS = 18;
    const FROM_TOKEN_BASE = new BigNumber(10).pow(FROM_TOKEN_DECIMALS);
    const TO_TOKEN_BASE = new BigNumber(10).pow(TO_TOKEN_DECIMALS);
    let testContract: TestUniswapV2BridgeContract;

    before(async () => {
        testContract = await TestUniswapV2BridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestUniswapV2Bridge,
            env.provider,
            env.txDefaults,
            artifacts,
        );
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
        interface TransferFromOpts {
            tokenAddressesPath: string[];
            toAddress: string;
            // Amount to pass into `bridgeTransferFrom()`
            amount: BigNumber;
            // Token balance of the bridge.
            fromTokenBalance: BigNumber;
            // Router reverts with this reason
            routerRevertReason: string;
        }

        interface TransferFromResult {
            opts: TransferFromOpts;
            result: string;
            logs: DecodedLogs;
            blocktime: number;
        }

        function createTransferFromOpts(opts?: Partial<TransferFromOpts>): TransferFromOpts {
            const amount = getRandomInteger(1, TO_TOKEN_BASE.times(100));
            return {
                tokenAddressesPath: Array(2).fill(constants.NULL_ADDRESS),
                amount,
                toAddress: randomAddress(),
                fromTokenBalance: getRandomInteger(1, FROM_TOKEN_BASE.times(100)),
                routerRevertReason: '',
                ...opts,
            };
        }

        const bridgeDataEncoder = AbiEncoder.create('(address[])');

        async function transferFromAsync(opts?: Partial<TransferFromOpts>): Promise<TransferFromResult> {
            const _opts = createTransferFromOpts(opts);

            for (let i = 0; i < _opts.tokenAddressesPath.length; i++) {
                const createFromTokenFn = testContract.createToken(_opts.tokenAddressesPath[i]);
                _opts.tokenAddressesPath[i] = await createFromTokenFn.callAsync();
                await createFromTokenFn.awaitTransactionSuccessAsync();
            }

            // Set the token balance for the token we're converting from.
            await testContract
                .setTokenBalance(_opts.tokenAddressesPath[0], _opts.fromTokenBalance)
                .awaitTransactionSuccessAsync();

            // Set revert reason for the router.
            await testContract.setRouterRevertReason(_opts.routerRevertReason).awaitTransactionSuccessAsync();

            // Call bridgeTransferFrom().
            const bridgeTransferFromFn = testContract.bridgeTransferFrom(
                // Output token
                _opts.tokenAddressesPath[_opts.tokenAddressesPath.length - 1],
                // Random maker address.
                randomAddress(),
                // Recipient address.
                _opts.toAddress,
                // Transfer amount.
                _opts.amount,
                // ABI-encode the input token address as the bridge data. // FIXME
                bridgeDataEncoder.encode([_opts.tokenAddressesPath]),
            );
            const result = await bridgeTransferFromFn.callAsync();
            const receipt = await bridgeTransferFromFn.awaitTransactionSuccessAsync();
            return {
                opts: _opts,
                result,
                logs: (receipt.logs as any) as DecodedLogs,
                blocktime: await env.web3Wrapper.getBlockTimestampAsync(receipt.blockNumber),
            };
        }

        it('returns magic bytes on success', async () => {
            const { result } = await transferFromAsync();
            expect(result).to.eq(AssetProxyId.ERC20Bridge);
        });

        it('performs transfer when both tokens are the same', async () => {
            const createTokenFn = testContract.createToken(constants.NULL_ADDRESS);
            const tokenAddress = await createTokenFn.callAsync();
            await createTokenFn.awaitTransactionSuccessAsync();

            const { opts, result, logs } = await transferFromAsync({
                tokenAddressesPath: [tokenAddress, tokenAddress],
            });
            expect(result).to.eq(AssetProxyId.ERC20Bridge, 'asset proxy id');
            const transfers = filterLogsToArguments<TokenTransferArgs>(logs, ContractEvents.TokenTransfer);

            expect(transfers.length).to.eq(1);
            expect(transfers[0].token).to.eq(tokenAddress, 'input token address');
            expect(transfers[0].from).to.eq(testContract.address);
            expect(transfers[0].to).to.eq(opts.toAddress, 'recipient address');
            expect(transfers[0].amount).to.bignumber.eq(opts.amount, 'amount');
        });

        describe('token -> token', async () => {
            it('calls UniswapV2Router01.swapExactTokensForTokens()', async () => {
                const { opts, result, logs, blocktime } = await transferFromAsync();
                expect(result).to.eq(AssetProxyId.ERC20Bridge, 'asset proxy id');
                const transfers = filterLogsToArguments<SwapExactTokensForTokensArgs>(
                    logs,
                    ContractEvents.SwapExactTokensForTokensInput,
                );

                expect(transfers.length).to.eq(1);
                expect(transfers[0].toTokenAddress).to.eq(
                    opts.tokenAddressesPath[opts.tokenAddressesPath.length - 1],
                    'output token address',
                );
                expect(transfers[0].to).to.eq(opts.toAddress, 'recipient address');
                expect(transfers[0].amountIn).to.bignumber.eq(opts.fromTokenBalance, 'input token amount');
                expect(transfers[0].amountOutMin).to.bignumber.eq(opts.amount, 'output token amount');
                expect(transfers[0].deadline).to.bignumber.eq(blocktime, 'deadline');
            });

            it('sets allowance for "from" token', async () => {
                const { logs } = await transferFromAsync();
                const approvals = filterLogsToArguments<TokenApproveArgs>(logs, ContractEvents.TokenApprove);
                const routerAddress = await testContract.getRouterAddress().callAsync();
                expect(approvals.length).to.eq(1);
                expect(approvals[0].spender).to.eq(routerAddress);
                expect(approvals[0].allowance).to.bignumber.eq(constants.MAX_UINT256);
            });

            it('sets allowance for "from" token on subsequent calls', async () => {
                const { opts } = await transferFromAsync();
                const { logs } = await transferFromAsync(opts);
                const approvals = filterLogsToArguments<TokenApproveArgs>(logs, ContractEvents.TokenApprove);
                const routerAddress = await testContract.getRouterAddress().callAsync();
                expect(approvals.length).to.eq(1);
                expect(approvals[0].spender).to.eq(routerAddress);
                expect(approvals[0].allowance).to.bignumber.eq(constants.MAX_UINT256);
            });

            it('fails if the router fails', async () => {
                const revertReason = 'FOOBAR';
                const tx = transferFromAsync({
                    routerRevertReason: revertReason,
                });
                return expect(tx).to.eventually.be.rejectedWith(revertReason);
            });
        });
        describe('token -> token -> token', async () => {
            it('calls UniswapV2Router01.swapExactTokensForTokens()', async () => {
                const { opts, result, logs, blocktime } = await transferFromAsync({
                    tokenAddressesPath: Array(3).fill(constants.NULL_ADDRESS),
                });
                expect(result).to.eq(AssetProxyId.ERC20Bridge, 'asset proxy id');
                const transfers = filterLogsToArguments<SwapExactTokensForTokensArgs>(
                    logs,
                    ContractEvents.SwapExactTokensForTokensInput,
                );

                expect(transfers.length).to.eq(1);
                expect(transfers[0].toTokenAddress).to.eq(
                    opts.tokenAddressesPath[opts.tokenAddressesPath.length - 1],
                    'output token address',
                );
                expect(transfers[0].to).to.eq(opts.toAddress, 'recipient address');
                expect(transfers[0].amountIn).to.bignumber.eq(opts.fromTokenBalance, 'input token amount');
                expect(transfers[0].amountOutMin).to.bignumber.eq(opts.amount, 'output token amount');
                expect(transfers[0].deadline).to.bignumber.eq(blocktime, 'deadline');
            });
        });
    });
});
