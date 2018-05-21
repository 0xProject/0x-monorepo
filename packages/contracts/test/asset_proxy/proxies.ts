import { ZeroEx } from '0x.js';
import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { DummyERC20TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c20_token';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import { assetProxyUtils } from '../../src/utils/asset_proxy_utils';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { ERC20Wrapper } from '../../src/utils/erc20_wrapper';
import { ERC721Wrapper } from '../../src/utils/erc721_wrapper';
import { AssetProxyId } from '../../src/utils/types';
import { provider, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Asset Transfer Proxies', () => {
    let owner: string;
    let notAuthorized: string;
    let exchangeAddress: string;
    let makerAddress: string;
    let takerAddress: string;

    let zrxToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let erc721MakerTokenId: BigNumber;

    let zeroEx: ZeroEx;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, notAuthorized, exchangeAddress, makerAddress, takerAddress] = accounts);

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        [zrxToken] = await erc20Wrapper.deployDummyTokensAsync();
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        await web3Wrapper.awaitTransactionMinedAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeAddress, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerTokenId = erc721Balances[makerAddress][erc721Token.address][0];
        await web3Wrapper.awaitTransactionMinedAsync(
            await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeAddress, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        zeroEx = new ZeroEx(provider, {
            networkId: constants.TESTRPC_NETWORK_ID,
        });
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('Transfer Proxy - ERC20', () => {
        describe('transferFrom', () => {
            it('should successfully transfer tokens', async () => {
                // Construct metadata for ERC20 proxy
                const encodedProxyMetadata = assetProxyUtils.encodeERC20ProxyData(zrxToken.address);
                // Perform a transfer from makerAddress to takerAddress
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const amount = new BigNumber(10);
                await web3Wrapper.awaitTransactionMinedAsync(
                    await erc20Proxy.transferFrom.sendTransactionAsync(
                        encodedProxyMetadata,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: exchangeAddress },
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address].minus(amount),
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address].add(amount),
                );
            });

            it('should do nothing if transferring 0 amount of a token', async () => {
                // Construct metadata for ERC20 proxy
                const encodedProxyMetadata = assetProxyUtils.encodeERC20ProxyData(zrxToken.address);
                // Perform a transfer from makerAddress to takerAddress
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const amount = new BigNumber(0);
                await web3Wrapper.awaitTransactionMinedAsync(
                    await erc20Proxy.transferFrom.sendTransactionAsync(
                        encodedProxyMetadata,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: exchangeAddress },
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address],
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address],
                );
            });

            it('should throw if allowances are too low', async () => {
                // Construct metadata for ERC20 proxy
                const encodedProxyMetadata = assetProxyUtils.encodeERC20ProxyData(zrxToken.address);
                // Create allowance less than transfer amount. Set allowance on proxy.
                const allowance = new BigNumber(0);
                const transferAmount = new BigNumber(10);
                await web3Wrapper.awaitTransactionMinedAsync(
                    await zrxToken.approve.sendTransactionAsync(erc20Proxy.address, allowance, {
                        from: makerAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Perform a transfer; expect this to fail.
                return expect(
                    erc20Proxy.transferFrom.sendTransactionAsync(
                        encodedProxyMetadata,
                        makerAddress,
                        takerAddress,
                        transferAmount,
                        { from: notAuthorized },
                    ),
                ).to.be.rejectedWith(constants.REVERT);
            });

            it('should throw if requesting address is not authorized', async () => {
                // Construct metadata for ERC20 proxy
                const encodedProxyMetadata = assetProxyUtils.encodeERC20ProxyData(zrxToken.address);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(10);
                return expect(
                    erc20Proxy.transferFrom.sendTransactionAsync(
                        encodedProxyMetadata,
                        makerAddress,
                        takerAddress,
                        amount,
                        {
                            from: notAuthorized,
                        },
                    ),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchTransferFrom', () => {
            it('should succesfully make multiple token transfers', async () => {
                const erc20Balances = await erc20Wrapper.getBalancesAsync();

                const encodedProxyMetadata = assetProxyUtils.encodeERC20ProxyData(zrxToken.address);
                const amount = new BigNumber(10);
                const numTransfers = 2;
                const assetMetadata = _.times(numTransfers, () => encodedProxyMetadata);
                const fromAddresses = _.times(numTransfers, () => makerAddress);
                const toAddresses = _.times(numTransfers, () => takerAddress);
                const amounts = _.times(numTransfers, () => amount);

                const txHash = await erc20Proxy.batchTransferFrom.sendTransactionAsync(
                    assetMetadata,
                    fromAddresses,
                    toAddresses,
                    amounts,
                    { from: exchangeAddress },
                );
                const res = await zeroEx.awaitTransactionMinedAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                const newBalances = await erc20Wrapper.getBalancesAsync();

                expect(res.logs.length).to.equal(numTransfers);
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address].minus(amount.times(numTransfers)),
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address].add(amount.times(numTransfers)),
                );
            });

            it('should throw if not called by an authorized address', async () => {
                const encodedProxyMetadata = assetProxyUtils.encodeERC20ProxyData(zrxToken.address);
                const amount = new BigNumber(10);
                const numTransfers = 2;
                const assetMetadata = _.times(numTransfers, () => encodedProxyMetadata);
                const fromAddresses = _.times(numTransfers, () => makerAddress);
                const toAddresses = _.times(numTransfers, () => takerAddress);
                const amounts = _.times(numTransfers, () => amount);

                expect(
                    erc20Proxy.batchTransferFrom.sendTransactionAsync(
                        assetMetadata,
                        fromAddresses,
                        toAddresses,
                        amounts,
                        { from: notAuthorized },
                    ),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        it('should have an id of 1', async () => {
            const proxyId = await erc20Proxy.getProxyId.callAsync();
            expect(proxyId).to.equal(1);
        });
    });

    describe('Transfer Proxy - ERC721', () => {
        describe('transferFrom', () => {
            it('should successfully transfer tokens', async () => {
                // Construct metadata for ERC721 proxy
                const encodedProxyMetadata = assetProxyUtils.encodeERC721ProxyData(
                    erc721Token.address,
                    erc721MakerTokenId,
                );
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.bignumber.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const amount = new BigNumber(1);
                await web3Wrapper.awaitTransactionMinedAsync(
                    await erc721Proxy.transferFrom.sendTransactionAsync(
                        encodedProxyMetadata,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: exchangeAddress },
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newOwnerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(newOwnerMakerAsset).to.be.bignumber.equal(takerAddress);
            });

            it('should throw if transferring 0 amount of a token', async () => {
                // Construct metadata for ERC721 proxy
                const encodedProxyMetadata = assetProxyUtils.encodeERC721ProxyData(
                    erc721Token.address,
                    erc721MakerTokenId,
                );
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.bignumber.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const amount = new BigNumber(0);
                return expect(
                    erc721Proxy.transferFrom.sendTransactionAsync(
                        encodedProxyMetadata,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: exchangeAddress },
                    ),
                ).to.be.rejectedWith(constants.REVERT);
            });

            it('should throw if transferring > 1 amount of a token', async () => {
                // Construct metadata for ERC721 proxy
                const encodedProxyMetadata = assetProxyUtils.encodeERC721ProxyData(
                    erc721Token.address,
                    erc721MakerTokenId,
                );
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.bignumber.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const amount = new BigNumber(500);
                return expect(
                    erc721Proxy.transferFrom.sendTransactionAsync(
                        encodedProxyMetadata,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: exchangeAddress },
                    ),
                ).to.be.rejectedWith(constants.REVERT);
            });

            it('should throw if allowances are too low', async () => {
                // Construct metadata for ERC721 proxy
                const encodedProxyMetadata = assetProxyUtils.encodeERC721ProxyData(
                    erc721Token.address,
                    erc721MakerTokenId,
                );
                // Remove transfer approval for makerAddress.
                await web3Wrapper.awaitTransactionMinedAsync(
                    await erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, false, {
                        from: makerAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Perform a transfer; expect this to fail.
                const amount = new BigNumber(1);
                return expect(
                    erc20Proxy.transferFrom.sendTransactionAsync(
                        encodedProxyMetadata,
                        makerAddress,
                        takerAddress,
                        amount,
                        {
                            from: notAuthorized,
                        },
                    ),
                ).to.be.rejectedWith(constants.REVERT);
            });

            it('should throw if requesting address is not authorized', async () => {
                // Construct metadata for ERC721 proxy
                const encodedProxyMetadata = assetProxyUtils.encodeERC721ProxyData(
                    erc721Token.address,
                    erc721MakerTokenId,
                );
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(1);
                return expect(
                    erc721Proxy.transferFrom.sendTransactionAsync(
                        encodedProxyMetadata,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: notAuthorized },
                    ),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        describe('batchTransferFrom', () => {
            it('should succesfully make multiple token transfers', async () => {
                const erc721TokensById = await erc721Wrapper.getBalancesAsync();
                const [makerTokenIdA, makerTokenIdB] = erc721TokensById[makerAddress][erc721Token.address];

                const numTransfers = 2;
                const assetMetadata = [
                    assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerTokenIdA),
                    assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerTokenIdB),
                ];
                const fromAddresses = _.times(numTransfers, () => makerAddress);
                const toAddresses = _.times(numTransfers, () => takerAddress);
                const amounts = _.times(numTransfers, () => new BigNumber(1));

                const txHash = await erc721Proxy.batchTransferFrom.sendTransactionAsync(
                    assetMetadata,
                    fromAddresses,
                    toAddresses,
                    amounts,
                    { from: exchangeAddress },
                );
                const res = await zeroEx.awaitTransactionMinedAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                expect(res.logs.length).to.equal(numTransfers);

                const newOwnerMakerAssetA = await erc721Token.ownerOf.callAsync(makerTokenIdA);
                const newOwnerMakerAssetB = await erc721Token.ownerOf.callAsync(makerTokenIdB);
                expect(newOwnerMakerAssetA).to.be.bignumber.equal(takerAddress);
                expect(newOwnerMakerAssetB).to.be.bignumber.equal(takerAddress);
            });

            it('should throw if not called by an authorized address', async () => {
                const erc721TokensById = await erc721Wrapper.getBalancesAsync();
                const [makerTokenIdA, makerTokenIdB] = erc721TokensById[makerAddress][erc721Token.address];

                const numTransfers = 2;
                const assetMetadata = [
                    assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerTokenIdA),
                    assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerTokenIdB),
                ];
                const fromAddresses = _.times(numTransfers, () => makerAddress);
                const toAddresses = _.times(numTransfers, () => takerAddress);
                const amounts = _.times(numTransfers, () => new BigNumber(1));

                expect(
                    erc721Proxy.batchTransferFrom.sendTransactionAsync(
                        assetMetadata,
                        fromAddresses,
                        toAddresses,
                        amounts,
                        { from: notAuthorized },
                    ),
                ).to.be.rejectedWith(constants.REVERT);
            });
        });

        it('should have an id of 2', async () => {
            const proxyId = await erc721Proxy.getProxyId.callAsync();
            expect(proxyId).to.equal(2);
        });
    });
});
