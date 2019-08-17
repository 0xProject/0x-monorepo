import { artifacts as proxyArtifacts, MixinAuthorizableContract } from '@0x/contracts-asset-proxy';
import {
    chaiSetup,
    constants,
    expectContractCallFailedAsync,
    expectContractCreationFailedAsync,
    expectTransactionFailedAsync,
    expectTransactionFailedWithoutReasonAsync,
    increaseTimeAndMineBlockAsync,
    provider,
    sendTransactionResult,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';

import {
    artifacts,
    AssetProxyOwnerAssetProxyRegistrationEventArgs,
    AssetProxyOwnerContract,
    AssetProxyOwnerExecutionEventArgs,
    AssetProxyOwnerExecutionFailureEventArgs,
    AssetProxyOwnerSubmissionEventArgs,
    AssetProxyOwnerWrapper,
    TestAssetProxyOwnerContract,
} from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('AssetProxyOwner', () => {
    let owners: string[];
    let authorized: string;
    let notOwner: string;
    const REQUIRED_APPROVALS = new BigNumber(2);
    const SECONDS_TIME_LOCKED = new BigNumber(1000000);

    let erc20Proxy: MixinAuthorizableContract;
    let erc721Proxy: MixinAuthorizableContract;
    let testAssetProxyOwner: TestAssetProxyOwnerContract;
    let assetProxyOwnerWrapper: AssetProxyOwnerWrapper;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owners = [accounts[0], accounts[1]];
        authorized = accounts[2];
        notOwner = accounts[3];
        const initialOwner = accounts[0];
        erc20Proxy = await MixinAuthorizableContract.deployFrom0xArtifactAsync(
            proxyArtifacts.MixinAuthorizable,
            provider,
            txDefaults,
            artifacts,
        );
        erc721Proxy = await MixinAuthorizableContract.deployFrom0xArtifactAsync(
            proxyArtifacts.MixinAuthorizable,
            provider,
            txDefaults,
            artifacts,
        );
        const defaultAssetProxyContractAddresses: string[] = [];
        testAssetProxyOwner = await TestAssetProxyOwnerContract.deployFrom0xArtifactAsync(
            artifacts.TestAssetProxyOwner,
            provider,
            txDefaults,
            artifacts,
            owners,
            defaultAssetProxyContractAddresses,
            REQUIRED_APPROVALS,
            SECONDS_TIME_LOCKED,
        );
        assetProxyOwnerWrapper = new AssetProxyOwnerWrapper(testAssetProxyOwner, provider);
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.transferOwnership.sendTransactionAsync(testAssetProxyOwner.address, {
                from: initialOwner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc721Proxy.transferOwnership.sendTransactionAsync(testAssetProxyOwner.address, {
                from: initialOwner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('constructor', () => {
        it('should register passed in assetProxyContracts', async () => {
            const assetProxyContractAddresses = [erc20Proxy.address, erc721Proxy.address];
            const newMultiSig = await AssetProxyOwnerContract.deployFrom0xArtifactAsync(
                artifacts.AssetProxyOwner,
                provider,
                txDefaults,
                artifacts,
                owners,
                assetProxyContractAddresses,
                REQUIRED_APPROVALS,
                SECONDS_TIME_LOCKED,
            );
            const isErc20ProxyRegistered = await newMultiSig.isAssetProxyRegistered.callAsync(erc20Proxy.address);
            const isErc721ProxyRegistered = await newMultiSig.isAssetProxyRegistered.callAsync(erc721Proxy.address);
            expect(isErc20ProxyRegistered).to.equal(true);
            expect(isErc721ProxyRegistered).to.equal(true);
        });
        it('should revert if a null address is included in assetProxyContracts', async () => {
            const assetProxyContractAddresses = [erc20Proxy.address, constants.NULL_ADDRESS];
            return expectContractCreationFailedAsync(
                (AssetProxyOwnerContract.deployFrom0xArtifactAsync(
                    artifacts.AssetProxyOwner,
                    provider,
                    txDefaults,
                    artifacts,
                    owners,
                    assetProxyContractAddresses,
                    REQUIRED_APPROVALS,
                    SECONDS_TIME_LOCKED,
                ) as any) as sendTransactionResult,
                RevertReason.InvalidAssetProxy,
            );
        });
    });

    describe('isFunctionRemoveAuthorizedAddressAtIndex', () => {
        it('should return false if data is not for removeAuthorizedAddressAtIndex', async () => {
            const notRemoveAuthorizedAddressData = erc20Proxy.addAuthorizedAddress.getABIEncodedTransactionData(
                owners[0],
            );

            const isFunctionRemoveAuthorizedAddressAtIndex = await testAssetProxyOwner.isFunctionRemoveAuthorizedAddressAtIndex.callAsync(
                notRemoveAuthorizedAddressData,
            );
            expect(isFunctionRemoveAuthorizedAddressAtIndex).to.be.false();
        });

        it('should return true if data is for removeAuthorizedAddressAtIndex', async () => {
            const index = new BigNumber(0);
            const removeAuthorizedAddressAtIndexData = erc20Proxy.removeAuthorizedAddressAtIndex.getABIEncodedTransactionData(
                owners[0],
                index,
            );
            const isFunctionRemoveAuthorizedAddressAtIndex = await testAssetProxyOwner.isFunctionRemoveAuthorizedAddressAtIndex.callAsync(
                removeAuthorizedAddressAtIndexData,
            );
            expect(isFunctionRemoveAuthorizedAddressAtIndex).to.be.true();
        });
    });

    describe('registerAssetProxy', () => {
        it('should revert if not called by multisig', async () => {
            const isRegistered = true;
            return expectTransactionFailedWithoutReasonAsync(
                testAssetProxyOwner.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, isRegistered, {
                    from: owners[0],
                }),
            );
        });

        it('should register an address if called by multisig after timelock', async () => {
            const addressToRegister = erc20Proxy.address;
            const isRegistered = true;
            const registerAssetProxyData = testAssetProxyOwner.registerAssetProxy.getABIEncodedTransactionData(
                addressToRegister,
                isRegistered,
            );
            const submitTxRes = await assetProxyOwnerWrapper.submitTransactionAsync(
                testAssetProxyOwner.address,
                registerAssetProxyData,
                owners[0],
            );

            const log = submitTxRes.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;
            const txId = log.args.transactionId;

            await assetProxyOwnerWrapper.confirmTransactionAsync(txId, owners[1]);
            await increaseTimeAndMineBlockAsync(SECONDS_TIME_LOCKED.toNumber());

            const executeTxRes = await assetProxyOwnerWrapper.executeTransactionAsync(txId, owners[0]);
            const registerLog = executeTxRes.logs[0] as LogWithDecodedArgs<
                AssetProxyOwnerAssetProxyRegistrationEventArgs
            >;
            expect(registerLog.args.assetProxyContract).to.equal(addressToRegister);
            expect(registerLog.args.isRegistered).to.equal(isRegistered);

            const isAssetProxyRegistered = await testAssetProxyOwner.isAssetProxyRegistered.callAsync(
                addressToRegister,
            );
            expect(isAssetProxyRegistered).to.equal(isRegistered);
        });

        it('should fail if registering a null address', async () => {
            const addressToRegister = constants.NULL_ADDRESS;
            const isRegistered = true;
            const registerAssetProxyData = testAssetProxyOwner.registerAssetProxy.getABIEncodedTransactionData(
                addressToRegister,
                isRegistered,
            );
            const submitTxRes = await assetProxyOwnerWrapper.submitTransactionAsync(
                testAssetProxyOwner.address,
                registerAssetProxyData,
                owners[0],
            );
            const log = submitTxRes.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;
            const txId = log.args.transactionId;

            await assetProxyOwnerWrapper.confirmTransactionAsync(txId, owners[1]);
            await increaseTimeAndMineBlockAsync(SECONDS_TIME_LOCKED.toNumber());

            const executeTxRes = await assetProxyOwnerWrapper.executeTransactionAsync(txId, owners[0]);
            const failureLog = executeTxRes.logs[0] as LogWithDecodedArgs<AssetProxyOwnerExecutionFailureEventArgs>;
            expect(failureLog.args.transactionId).to.be.bignumber.equal(txId);

            const isAssetProxyRegistered = await testAssetProxyOwner.isAssetProxyRegistered.callAsync(
                addressToRegister,
            );
            expect(isAssetProxyRegistered).to.equal(false);
        });
    });

    describe('Calling removeAuthorizedAddressAtIndex', () => {
        const erc20Index = new BigNumber(0);
        const erc721Index = new BigNumber(1);
        before('authorize both proxies and register erc20 proxy', async () => {
            // Only register ERC20 proxy
            const addressToRegister = erc20Proxy.address;
            const isRegistered = true;
            const registerAssetProxyData = testAssetProxyOwner.registerAssetProxy.getABIEncodedTransactionData(
                addressToRegister,
                isRegistered,
            );
            const registerAssetProxySubmitRes = await assetProxyOwnerWrapper.submitTransactionAsync(
                testAssetProxyOwner.address,
                registerAssetProxyData,
                owners[0],
            );
            const registerAssetProxySubmitLog = registerAssetProxySubmitRes.logs[0] as LogWithDecodedArgs<
                AssetProxyOwnerSubmissionEventArgs
            >;

            const addAuthorizedAddressData = erc20Proxy.addAuthorizedAddress.getABIEncodedTransactionData(authorized);
            const erc20AddAuthorizedAddressSubmitRes = await assetProxyOwnerWrapper.submitTransactionAsync(
                erc20Proxy.address,
                addAuthorizedAddressData,
                owners[0],
            );
            const erc721AddAuthorizedAddressSubmitRes = await assetProxyOwnerWrapper.submitTransactionAsync(
                erc721Proxy.address,
                addAuthorizedAddressData,
                owners[0],
            );
            const erc20AddAuthorizedAddressSubmitLog = erc20AddAuthorizedAddressSubmitRes.logs[0] as LogWithDecodedArgs<
                AssetProxyOwnerSubmissionEventArgs
            >;
            const erc721AddAuthorizedAddressSubmitLog = erc721AddAuthorizedAddressSubmitRes
                .logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;

            const registerAssetProxyTxId = registerAssetProxySubmitLog.args.transactionId;
            const erc20AddAuthorizedAddressTxId = erc20AddAuthorizedAddressSubmitLog.args.transactionId;
            const erc721AddAuthorizedAddressTxId = erc721AddAuthorizedAddressSubmitLog.args.transactionId;

            await assetProxyOwnerWrapper.confirmTransactionAsync(registerAssetProxyTxId, owners[1]);
            await assetProxyOwnerWrapper.confirmTransactionAsync(erc20AddAuthorizedAddressTxId, owners[1]);
            await assetProxyOwnerWrapper.confirmTransactionAsync(erc721AddAuthorizedAddressTxId, owners[1]);
            await increaseTimeAndMineBlockAsync(SECONDS_TIME_LOCKED.toNumber());
            await assetProxyOwnerWrapper.executeTransactionAsync(registerAssetProxyTxId, owners[0]);
            await assetProxyOwnerWrapper.executeTransactionAsync(erc20AddAuthorizedAddressTxId, owners[0], {
                gas: constants.MAX_EXECUTE_TRANSACTION_GAS,
            });
            await assetProxyOwnerWrapper.executeTransactionAsync(erc721AddAuthorizedAddressTxId, owners[0], {
                gas: constants.MAX_EXECUTE_TRANSACTION_GAS,
            });
        });

        describe('validRemoveAuthorizedAddressAtIndexTx', () => {
            it('should revert if data is not for removeAuthorizedAddressAtIndex and proxy is registered', async () => {
                const notRemoveAuthorizedAddressData = erc20Proxy.addAuthorizedAddress.getABIEncodedTransactionData(
                    authorized,
                );
                const submitTxRes = await assetProxyOwnerWrapper.submitTransactionAsync(
                    erc20Proxy.address,
                    notRemoveAuthorizedAddressData,
                    owners[0],
                );
                const log = submitTxRes.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;
                const txId = log.args.transactionId;
                return expectContractCallFailedAsync(
                    testAssetProxyOwner.testValidRemoveAuthorizedAddressAtIndexTx.callAsync(txId),
                    RevertReason.InvalidFunctionSelector,
                );
            });

            it('should return true if data is for removeAuthorizedAddressAtIndex and proxy is registered', async () => {
                const removeAuthorizedAddressAtIndexData = erc20Proxy.removeAuthorizedAddressAtIndex.getABIEncodedTransactionData(
                    authorized,
                    erc20Index,
                );
                const submitTxRes = await assetProxyOwnerWrapper.submitTransactionAsync(
                    erc20Proxy.address,
                    removeAuthorizedAddressAtIndexData,
                    owners[0],
                );
                const log = submitTxRes.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;
                const txId = log.args.transactionId;
                const isValidRemoveAuthorizedAddressAtIndexTx = await testAssetProxyOwner.testValidRemoveAuthorizedAddressAtIndexTx.callAsync(
                    txId,
                );
                expect(isValidRemoveAuthorizedAddressAtIndexTx).to.be.true();
            });

            it('should revert if data is for removeAuthorizedAddressAtIndex and proxy is not registered', async () => {
                const removeAuthorizedAddressAtIndexData = erc721Proxy.removeAuthorizedAddressAtIndex.getABIEncodedTransactionData(
                    authorized,
                    erc721Index,
                );
                const submitTxRes = await assetProxyOwnerWrapper.submitTransactionAsync(
                    erc721Proxy.address,
                    removeAuthorizedAddressAtIndexData,
                    owners[0],
                );
                const log = submitTxRes.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;
                const txId = log.args.transactionId;
                return expectContractCallFailedAsync(
                    testAssetProxyOwner.testValidRemoveAuthorizedAddressAtIndexTx.callAsync(txId),
                    RevertReason.UnregisteredAssetProxy,
                );
            });
        });

        describe('executeRemoveAuthorizedAddressAtIndex', () => {
            it('should revert without the required confirmations', async () => {
                const removeAuthorizedAddressAtIndexData = erc20Proxy.removeAuthorizedAddressAtIndex.getABIEncodedTransactionData(
                    authorized,
                    erc20Index,
                );
                const res = await assetProxyOwnerWrapper.submitTransactionAsync(
                    erc20Proxy.address,
                    removeAuthorizedAddressAtIndexData,
                    owners[0],
                );
                const log = res.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;
                const txId = log.args.transactionId;

                return expectTransactionFailedAsync(
                    testAssetProxyOwner.executeRemoveAuthorizedAddressAtIndex.sendTransactionAsync(txId, {
                        from: owners[1],
                    }),
                    RevertReason.TxNotFullyConfirmed,
                );
            });

            it('should revert if tx destination is not registered', async () => {
                const removeAuthorizedAddressAtIndexData = erc721Proxy.removeAuthorizedAddressAtIndex.getABIEncodedTransactionData(
                    authorized,
                    erc721Index,
                );
                const res = await assetProxyOwnerWrapper.submitTransactionAsync(
                    erc721Proxy.address,
                    removeAuthorizedAddressAtIndexData,
                    owners[0],
                );
                const log = res.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;
                const txId = log.args.transactionId;

                await assetProxyOwnerWrapper.confirmTransactionAsync(txId, owners[1]);

                return expectTransactionFailedAsync(
                    testAssetProxyOwner.executeRemoveAuthorizedAddressAtIndex.sendTransactionAsync(txId, {
                        from: owners[1],
                    }),
                    RevertReason.UnregisteredAssetProxy,
                );
            });

            it('should revert if tx data is not for removeAuthorizedAddressAtIndex', async () => {
                const newAuthorized = owners[1];
                const addAuthorizedAddressData = erc20Proxy.addAuthorizedAddress.getABIEncodedTransactionData(
                    newAuthorized,
                );
                const res = await assetProxyOwnerWrapper.submitTransactionAsync(
                    erc20Proxy.address,
                    addAuthorizedAddressData,
                    owners[0],
                );
                const log = res.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;
                const txId = log.args.transactionId;

                await assetProxyOwnerWrapper.confirmTransactionAsync(txId, owners[1]);

                return expectTransactionFailedAsync(
                    testAssetProxyOwner.executeRemoveAuthorizedAddressAtIndex.sendTransactionAsync(txId, {
                        from: owners[1],
                    }),
                    RevertReason.InvalidFunctionSelector,
                );
            });

            it('should execute removeAuthorizedAddressAtIndex for registered address if fully confirmed and called by owner', async () => {
                const isAuthorizedBefore = await erc20Proxy.authorized.callAsync(authorized);
                expect(isAuthorizedBefore).to.equal(true);

                const removeAuthorizedAddressAtIndexData = erc20Proxy.removeAuthorizedAddressAtIndex.getABIEncodedTransactionData(
                    authorized,
                    erc20Index,
                );
                const submitRes = await assetProxyOwnerWrapper.submitTransactionAsync(
                    erc20Proxy.address,
                    removeAuthorizedAddressAtIndexData,
                    owners[0],
                );
                const submitLog = submitRes.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;
                const txId = submitLog.args.transactionId;

                await assetProxyOwnerWrapper.confirmTransactionAsync(txId, owners[1]);

                const execRes = await assetProxyOwnerWrapper.executeRemoveAuthorizedAddressAtIndexAsync(
                    txId,
                    owners[0],
                );
                const execLog = execRes.logs[1] as LogWithDecodedArgs<AssetProxyOwnerExecutionEventArgs>;
                expect(execLog.args.transactionId).to.be.bignumber.equal(txId);

                const tx = await testAssetProxyOwner.transactions.callAsync(txId);
                const isExecuted = tx[3];
                expect(isExecuted).to.equal(true);

                const isAuthorizedAfter = await erc20Proxy.authorized.callAsync(authorized);
                expect(isAuthorizedAfter).to.equal(false);
            });

            it('should execute removeAuthorizedAddressAtIndex for registered address if fully confirmed and called by non-owner', async () => {
                const isAuthorizedBefore = await erc20Proxy.authorized.callAsync(authorized);
                expect(isAuthorizedBefore).to.equal(true);

                const removeAuthorizedAddressAtIndexData = erc20Proxy.removeAuthorizedAddressAtIndex.getABIEncodedTransactionData(
                    authorized,
                    erc20Index,
                );
                const submitRes = await assetProxyOwnerWrapper.submitTransactionAsync(
                    erc20Proxy.address,
                    removeAuthorizedAddressAtIndexData,
                    owners[0],
                );
                const submitLog = submitRes.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;
                const txId = submitLog.args.transactionId;

                await assetProxyOwnerWrapper.confirmTransactionAsync(txId, owners[1]);

                const execRes = await assetProxyOwnerWrapper.executeRemoveAuthorizedAddressAtIndexAsync(txId, notOwner);
                const execLog = execRes.logs[1] as LogWithDecodedArgs<AssetProxyOwnerExecutionEventArgs>;
                expect(execLog.args.transactionId).to.be.bignumber.equal(txId);

                const tx = await testAssetProxyOwner.transactions.callAsync(txId);
                const isExecuted = tx[3];
                expect(isExecuted).to.equal(true);

                const isAuthorizedAfter = await erc20Proxy.authorized.callAsync(authorized);
                expect(isAuthorizedAfter).to.equal(false);
            });

            it('should revert if already executed', async () => {
                const removeAuthorizedAddressAtIndexData = erc20Proxy.removeAuthorizedAddressAtIndex.getABIEncodedTransactionData(
                    authorized,
                    erc20Index,
                );
                const submitRes = await assetProxyOwnerWrapper.submitTransactionAsync(
                    erc20Proxy.address,
                    removeAuthorizedAddressAtIndexData,
                    owners[0],
                );
                const submitLog = submitRes.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>;
                const txId = submitLog.args.transactionId;

                await assetProxyOwnerWrapper.confirmTransactionAsync(txId, owners[1]);

                const execRes = await assetProxyOwnerWrapper.executeRemoveAuthorizedAddressAtIndexAsync(
                    txId,
                    owners[0],
                );
                const execLog = execRes.logs[1] as LogWithDecodedArgs<AssetProxyOwnerExecutionEventArgs>;
                expect(execLog.args.transactionId).to.be.bignumber.equal(txId);

                const tx = await testAssetProxyOwner.transactions.callAsync(txId);
                const isExecuted = tx[3];
                expect(isExecuted).to.equal(true);

                return expectTransactionFailedWithoutReasonAsync(
                    testAssetProxyOwner.executeRemoveAuthorizedAddressAtIndex.sendTransactionAsync(txId, {
                        from: owners[1],
                    }),
                );
            });
        });
    });
});
// tslint:disable-line max-file-line-count
