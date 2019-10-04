import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    hexLeftPad,
    hexRightPad,
    hexSlice,
    Numberish,
    randomAddress,
} from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { AbiEncoder, AuthorizableRevertErrors, BigNumber, StringRevertError } from '@0x/utils';
import { DecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    ERC20BridgeProxyContract,
    TestERC20BridgeBridgeWithdrawToEventArgs,
    TestERC20BridgeContract,
} from '../src';

blockchainTests.resets('ERC20BridgeProxy unit tests', env => {
    const PROXY_ID = AssetProxyId.ERC20Bridge;
    const BRIDGE_SUCCESS_RETURN_DATA = hexRightPad(PROXY_ID);
    let owner: string;
    let badCaller: string;
    let assetProxy: ERC20BridgeProxyContract;
    let bridgeContract: TestERC20BridgeContract;
    let testTokenAddress: string;

    before(async () => {
        [owner, badCaller] = await env.getAccountAddressesAsync();
        assetProxy = await ERC20BridgeProxyContract.deployFrom0xArtifactAsync(
            artifacts.ERC20BridgeProxy,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        bridgeContract = await TestERC20BridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestERC20Bridge,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        testTokenAddress = await bridgeContract.testToken.callAsync();
        await assetProxy.addAuthorizedAddress.awaitTransactionSuccessAsync(owner);
    });

    interface AssetDataOpts {
        tokenAddress: string;
        bridgeAddress: string;
        bridgeData: BridgeDataOpts;
    }

    interface BridgeDataOpts {
        transferAmount: Numberish;
        revertError?: string;
        returnData: string;
    }

    function createAssetData(opts?: Partial<AssetDataOpts>): AssetDataOpts {
        return _.merge(
            {
                tokenAddress: testTokenAddress,
                bridgeAddress: bridgeContract.address,
                bridgeData: createBridgeData(),
            },
            opts,
        );
    }

    function createBridgeData(opts?: Partial<BridgeDataOpts>): BridgeDataOpts {
        return _.merge(
            {
                transferAmount: constants.ZERO_AMOUNT,
                returnData: BRIDGE_SUCCESS_RETURN_DATA,
            },
            opts,
        );
    }

    function encodeAssetData(opts: AssetDataOpts): string {
        const encoder = AbiEncoder.createMethod('ERC20BridgeProxy', [
            { name: 'tokenAddress', type: 'address' },
            { name: 'bridgeAddress', type: 'address' },
            { name: 'bridgeData', type: 'bytes' },
        ]);
        return encoder.encode([opts.tokenAddress, opts.bridgeAddress, encodeBridgeData(opts.bridgeData)]);
    }

    function encodeBridgeData(opts: BridgeDataOpts): string {
        const encoder = AbiEncoder.create([
            { name: 'transferAmount', type: 'int256' },
            { name: 'revertData', type: 'bytes' },
            { name: 'returnData', type: 'bytes' },
        ]);
        const revertErrorBytes =
            opts.revertError !== undefined ? new StringRevertError(opts.revertError).encode() : '0x';
        return encoder.encode([new BigNumber(opts.transferAmount), revertErrorBytes, opts.returnData]);
    }

    async function setTestTokenBalanceAsync(_owner: string, balance: Numberish): Promise<void> {
        await bridgeContract.setTestTokenBalance.awaitTransactionSuccessAsync(_owner, new BigNumber(balance));
    }

    describe('transferFrom()', () => {
        interface TransferFromOpts {
            assetData: AssetDataOpts;
            from: string;
            to: string;
            amount: Numberish;
        }

        function createTransferFromOpts(opts?: Partial<TransferFromOpts>): TransferFromOpts {
            const transferAmount = _.get(opts, ['amount'], getRandomInteger(1, 100e18)) as BigNumber;
            return _.merge(
                {
                    assetData: createAssetData({
                        bridgeData: createBridgeData({
                            transferAmount,
                        }),
                    }),
                    from: randomAddress(),
                    to: randomAddress(),
                    amount: transferAmount,
                },
                opts,
            );
        }

        async function transferFromAsync(opts?: Partial<TransferFromOpts>, caller?: string): Promise<DecodedLogs> {
            const _opts = createTransferFromOpts(opts);
            const { logs } = await assetProxy.transferFrom.awaitTransactionSuccessAsync(
                encodeAssetData(_opts.assetData),
                _opts.from,
                _opts.to,
                new BigNumber(_opts.amount),
                { from: caller },
            );
            return (logs as any) as DecodedLogs;
        }

        it('succeeds if the bridge succeeds and balance increases by `amount`', async () => {
            const tx = transferFromAsync();
            return expect(tx).to.be.fulfilled('');
        });

        it('succeeds if balance increases more than `amount`', async () => {
            const amount = getRandomInteger(1, 100e18);
            const tx = transferFromAsync({
                amount,
                assetData: createAssetData({
                    bridgeData: createBridgeData({
                        transferAmount: amount.plus(1),
                    }),
                }),
            });
            return expect(tx).to.be.fulfilled('');
        });

        it('passes the correct arguments to the bridge contract', async () => {
            const opts = createTransferFromOpts();
            const logs = await transferFromAsync(opts);
            expect(logs.length).to.eq(1);
            const args = logs[0].args as TestERC20BridgeBridgeWithdrawToEventArgs;
            expect(args.tokenAddress).to.eq(opts.assetData.tokenAddress);
            expect(args.from).to.eq(opts.from);
            expect(args.to).to.eq(opts.to);
            expect(args.amount).to.bignumber.eq(opts.amount);
            expect(args.bridgeData).to.eq(encodeBridgeData(opts.assetData.bridgeData));
        });

        it('fails if not called by an authorized address', async () => {
            const tx = transferFromAsync({}, badCaller);
            return expect(tx).to.revertWith(new AuthorizableRevertErrors.SenderNotAuthorizedError(badCaller));
        });

        it('fails if asset data is truncated', async () => {
            const opts = createTransferFromOpts();
            const truncatedAssetData = hexSlice(encodeAssetData(opts.assetData), 0, -1);
            const tx = assetProxy.transferFrom.awaitTransactionSuccessAsync(
                truncatedAssetData,
                opts.from,
                opts.to,
                new BigNumber(opts.amount),
            );
            return expect(tx).to.be.rejected();
        });

        it('fails if bridge returns nothing', async () => {
            const tx = transferFromAsync({
                assetData: createAssetData({
                    bridgeData: createBridgeData({
                        returnData: '0x',
                    }),
                }),
            });
            // This will actually revert when the AP tries to decode the return
            // value.
            return expect(tx).to.be.rejected();
        });

        it('fails if bridge returns true', async () => {
            const tx = transferFromAsync({
                assetData: createAssetData({
                    bridgeData: createBridgeData({
                        returnData: hexLeftPad('0x1'),
                    }),
                }),
            });
            // This will actually revert when the AP tries to decode the return
            // value.
            return expect(tx).to.be.rejected();
        });

        it('fails if bridge returns 0x1', async () => {
            const tx = transferFromAsync({
                assetData: createAssetData({
                    bridgeData: createBridgeData({
                        returnData: hexRightPad('0x1'),
                    }),
                }),
            });
            return expect(tx).to.revertWith('BRIDGE_FAILED');
        });

        it('fails if bridge is an EOA', async () => {
            const tx = transferFromAsync({
                assetData: createAssetData({
                    bridgeAddress: randomAddress(),
                }),
            });
            // This will actually revert when the AP tries to decode the return
            // value.
            return expect(tx).to.be.rejected();
        });

        it('fails if bridge reverts', async () => {
            const revertError = 'FOOBAR';
            const tx = transferFromAsync({
                assetData: createAssetData({
                    bridgeData: createBridgeData({
                        revertError,
                    }),
                }),
            });
            return expect(tx).to.revertWith(revertError);
        });

        it('fails if balance of `to` increases by less than `amount`', async () => {
            const amount = getRandomInteger(1, 100e18);
            const tx = transferFromAsync({
                amount,
                assetData: createAssetData({
                    bridgeData: createBridgeData({
                        transferAmount: amount.minus(1),
                    }),
                }),
            });
            return expect(tx).to.revertWith('BRIDGE_UNDERPAY');
        });

        it('fails if balance of `to` decreases', async () => {
            const toAddress = randomAddress();
            await setTestTokenBalanceAsync(toAddress, 1e18);
            const tx = transferFromAsync({
                to: toAddress,
                assetData: createAssetData({
                    bridgeData: createBridgeData({
                        transferAmount: -1,
                    }),
                }),
            });
            return expect(tx).to.revertWith('BRIDGE_UNDERPAY');
        });
    });

    describe('balanceOf()', () => {
        it('retrieves the balance of the encoded token', async () => {
            const _owner = randomAddress();
            const balance = getRandomInteger(1, 100e18);
            await bridgeContract.setTestTokenBalance.awaitTransactionSuccessAsync(_owner, balance);
            const assetData = createAssetData({
                tokenAddress: testTokenAddress,
            });
            const actualBalance = await assetProxy.balanceOf.callAsync(encodeAssetData(assetData), _owner);
            expect(actualBalance).to.bignumber.eq(balance);
        });
    });

    describe('getProxyId()', () => {
        it('returns the correct proxy ID', async () => {
            const proxyId = await assetProxy.getProxyId.callAsync();
            expect(proxyId).to.eq(PROXY_ID);
        });
    });
});
