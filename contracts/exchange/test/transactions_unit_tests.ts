import {
    blockchainTests,
    constants,
    describe,
    expect,
    getLatestBlockTimestampAsync,
    hexRandom,
    LogDecoder,
} from '@0x/contracts-test-utils';
import { ExchangeRevertErrors, transactionHashUtils } from '@0x/order-utils';
import { EIP712DomainWithDefaultSchema } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts, TestTransactionsContract, TestTransactionsTransactionExecutionEventArgs } from '../src';

blockchainTests.resets('Transaction Unit Tests', ({ provider, web3Wrapper, txDefaults }) => {
    let transactionsContract: TestTransactionsContract;
    let accounts: string[];
    let domain: EIP712DomainWithDefaultSchema;
    let logDecoder: LogDecoder;

    const randomSignature = () => hexRandom(66);

    const EMPTY_ZERO_EX_TRANSACTION = {
        salt: constants.ZERO_AMOUNT,
        expirationTimeSeconds: constants.ZERO_AMOUNT,
        signerAddress: constants.NULL_ADDRESS,
        data: constants.NULL_BYTES,
        domain: {
            verifyingContractAddress: constants.NULL_ADDRESS,
            chainId: 0,
        },
    };

    before(async () => {
        // A list of available addresses to use during testing.
        accounts = await web3Wrapper.getAvailableAddressesAsync();

        // Insantiate a LogDecoder instance
        logDecoder = new LogDecoder(web3Wrapper, artifacts);

        // Deploy the transaction test contract.
        transactionsContract = await TestTransactionsContract.deployFrom0xArtifactAsync(
            artifacts.TestTransactions,
            provider,
            txDefaults,
            {},
        );

        // Set the default domain.
        domain = {
            verifyingContractAddress: transactionsContract.address,
            chainId: 1337,
        };
    });

    describe('batchExecuteTransaction', () => {
        it('should revert if the only call to executeTransaction fails', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10), // Set the expiration time to before the current timestamp
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.Expired,
                transactionHash,
            );
            const tx = transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                [transaction],
                [randomSignature()],
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the second call to executeTransaction fails', async () => {
            // Set the contract to accept signatures.
            await expect(transactionsContract.setShouldBeValid.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract to fail on calls to the fallback function. Note: This call is unnecessary but is kept for readability.
            await expect(transactionsContract.setShouldCallSucceed.sendTransactionAsync(true)).to.be.fulfilled('');

            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                data: '0x', // This call should succeed
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                domain,
            };
            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                data: '0x32', // This call should fail because the calldata is invalid
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction2);
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                transactionHash,
                constants.NULL_BYTES,
            );
            const tx = transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                [transaction1, transaction2],
                [randomSignature(), randomSignature()],
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the first call to executeTransaction fails', async () => {
            // Set the contract to accept signatures.
            await expect(transactionsContract.setShouldBeValid.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract to fail on calls to the fallback function. Note: This call is unnecessary but is kept for readability.
            await expect(transactionsContract.setShouldCallSucceed.sendTransactionAsync(true)).to.be.fulfilled('');

            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                data: '0x32', // This call should fail because the calldata is invalid
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                domain,
            };
            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                data: '0x', // This call should succeed
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction1);
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                transactionHash,
                constants.NULL_BYTES,
            );
            const tx = transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                [transaction1, transaction2],
                [randomSignature(), randomSignature()],
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the same transaction is executed twice in a batch', async () => {
            // Set the contract to accept signatures.
            await expect(transactionsContract.setShouldBeValid.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract to fail on calls to the fallback function. Note: This call is unnecessary but is kept for readability.
            await expect(transactionsContract.setShouldCallSucceed.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract fallbackReturnData to the recognizable string of bytes 0xDEADBEEF
            await expect(transactionsContract.setFallbackReturnData.sendTransactionAsync('0xdeadbeef')).to.be.fulfilled(
                '',
            );

            // Set up the necessary data for the transactions and tests
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // This is different than the account that will be used to send.
                domain,
            };
            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // This is different than the account that will be used to send.
                domain,
            };
            const transactionHash2 = transactionHashUtils.getTransactionHashHex(transaction2);

            // Verify that the transaction reverts
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.AlreadyExecuted,
                transactionHash2,
            );
            const tx = transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                [transaction1, transaction2],
                [randomSignature(), randomSignature()],
                {
                    from: accounts[0],
                },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed if the only call to executeTransaction succeeds', async () => {
            // Set the contract to accept signatures.
            await expect(transactionsContract.setShouldBeValid.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract to fail on calls to the fallback function. Note: This call is unnecessary but is kept for readability.
            await expect(transactionsContract.setShouldCallSucceed.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract fallbackReturnData to the recognizable string of bytes 0xDEADBEEF
            await expect(transactionsContract.setFallbackReturnData.sendTransactionAsync('0xdeadbeef')).to.be.fulfilled(
                '',
            );

            // Set up the necessary data for the transactions and tests
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // This is different than the account that will be used to send.
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);

            // Verify that the returndata of the transaction is 0xDEADBEEF
            const result = await transactionsContract.batchExecuteTransactions.callAsync(
                [transaction],
                [randomSignature()],
                {
                    from: accounts[0],
                },
            );
            expect(result.length).to.be.eq(1);
            expect(result[0] === '0xdeadbeef').to.be.true();

            // Verify that the logs returned from the call are correct.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                    [transaction],
                    [randomSignature()],
                    {
                        from: accounts[0],
                    },
                ),
            );
            const logs = receipt.logs as Array<LogWithDecodedArgs<TestTransactionsTransactionExecutionEventArgs>>;
            expect(logs.length).to.be.eq(1);
            expect(logs[0].event === 'TransactionExecution').to.be.true();
            expect(logs[0].args.transactionHash).to.eq(transactionHash);
        });

        it('should succeed if the both calls to executeTransaction succeed', async () => {
            // Set the contract to accept signatures.
            await expect(transactionsContract.setShouldBeValid.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract to fail on calls to the fallback function. Note: This call is unnecessary but is kept for readability.
            await expect(transactionsContract.setShouldCallSucceed.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract fallbackReturnData to the recognizable string of bytes 0xDEADBEEF
            await expect(transactionsContract.setFallbackReturnData.sendTransactionAsync('0xdeadbeef')).to.be.fulfilled(
                '',
            );

            // Set up the necessary data for the transactions and tests
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[0], // This is different than the account that will be used to send.
                domain,
            };
            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // This is different than the account that will be used to send.
                domain,
            };
            const transactionHash1 = transactionHashUtils.getTransactionHashHex(transaction1);
            const transactionHash2 = transactionHashUtils.getTransactionHashHex(transaction2);

            // Verify that the returndata of the transaction is 0xDEADBEEF
            const result = await transactionsContract.batchExecuteTransactions.callAsync(
                [transaction1, transaction2],
                [randomSignature(), randomSignature()],
                {
                    from: accounts[0],
                },
            );
            expect(result.length).to.be.eq(2);
            expect(result[0] === '0xdeadbeef').to.be.true();
            expect(result[1] === '0xdeadbeef').to.be.true();

            // Verify that the logs returned from the call are correct.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                    [transaction1, transaction2],
                    [randomSignature(), randomSignature()],
                    {
                        from: accounts[0],
                    },
                ),
            );

            const logs = receipt.logs as Array<LogWithDecodedArgs<TestTransactionsTransactionExecutionEventArgs>>;
            expect(logs.length).to.be.eq(2);
            logs.map(log => expect(log.event === 'TransactionExecution').to.be.true());
            expect(logs[0].args.transactionHash).to.eq(transactionHash1);
            expect(logs[1].args.transactionHash).to.eq(transactionHash2);
        });
    });

    describe('executeTransaction', () => {
        it('should revert if the current time is past the expiration time', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10), // Set the expiration time to before the current timestamp
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.Expired,
                transactionHash,
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, randomSignature());
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the current context address is not address zero', async () => {
            // Set the current context address to a nonzero address before the call to `executeTransaction()`
            expect(transactionsContract.setCurrentContextAddress.sendTransactionAsync(accounts[0])).to.be.fulfilled('');

            // Run the transaction with an updated current context address
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.NoReentrancy,
                transactionHash,
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, randomSignature());
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the transaction has been executed previously', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);

            // Make it seem like the transaction has already been executed by setting it's value in the transactionsExecuted
            // mapping to true.
            await expect(transactionsContract.setTransactionHash.sendTransactionAsync(transactionHash)).to.be.fulfilled(
                '',
            );

            // Run the transaction with an updated current context address
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.AlreadyExecuted,
                transactionHash,
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, randomSignature());
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the signer != msg.sender and the signature is not valid', async () => {
            // Set the contract to not accept signatures. Note: This doesn't need to be called but is kept for readability.
            // await expect(transactionsContract.setShouldBeValid.sendTransactionAsync(false)).to.be.fulfilled('');

            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // This is different than the account that will be used to send.
                domain,
            };
            const signature = randomSignature();
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionSignatureError(
                transactionHash,
                accounts[1],
                signature,
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, signature, {
                from: accounts[0],
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the signer == msg.sender but the delegatecall fails', async () => {
            // Set the contract to fail on calls to the fallback function. Note: This call is unnecessary but is kept for readability.
            // await expect(transactionsContract.setShouldBeValid.sendTransactionAsync(false)).to.be.fulfilled('');

            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1],
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                transactionHash,
                constants.NULL_BYTES,
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, randomSignature(), {
                from: accounts[1],
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the signer != msg.sender and the signature is valid but the delegatecall fails', async () => {
            // Set the contract to accept signatures.
            await expect(transactionsContract.setShouldBeValid.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract to fail on calls to the fallback function. Note: This call is unnecessary but is kept for readability.
            // await expect(transactionsContract.setShouldSucceedCall.sendTransactionAsync(false)).to.be.fulfilled('');

            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // This is different than the account that will be used to send.
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                transactionHash,
                constants.NULL_BYTES,
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, randomSignature(), {
                from: accounts[0],
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert with the correct return data if the signer != msg.sender and the signature is valid but the delegatecall fails', async () => {
            // Set the contract to accept signatures.
            await expect(transactionsContract.setShouldBeValid.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract to fail on calls to the fallback function. Note: This call is unnecessary but is kept for readability.
            // await expect(transactionsContract.setShouldCallSucceed.sendTransactionAsync(false)).to.be.fulfilled('');

            // Set the contract fallbackReturnData to the recognizable string of bytes 0xDEADBEEF
            await expect(transactionsContract.setFallbackReturnData.sendTransactionAsync('0xdeadbeef')).to.be.fulfilled(
                '',
            );

            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // This is different than the account that will be used to send.
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(transactionHash, '0xdeadbeef');
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, randomSignature(), {
                from: accounts[0],
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed with the correct return hash and event emitted', async () => {
            // Set the contract to accept signatures.
            await expect(transactionsContract.setShouldBeValid.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract to fail on calls to the fallback function. Note: This call is unnecessary but is kept for readability.
            await expect(transactionsContract.setShouldCallSucceed.sendTransactionAsync(true)).to.be.fulfilled('');

            // Set the contract fallbackReturnData to the recognizable string of bytes 0xDEADBEEF
            await expect(transactionsContract.setFallbackReturnData.sendTransactionAsync('0xdeadbeef')).to.be.fulfilled(
                '',
            );

            // Set up the necessary data for the transactions and tests
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // This is different than the account that will be used to send.
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);

            // Verify that the returndata of the transaction is 0xDEADBEEF
            const result = await transactionsContract.executeTransaction.callAsync(transaction, randomSignature(), {
                from: accounts[0],
            });
            expect(result === '0xdeadbeef').to.be.true();

            // Verify that the logs returned from the call are correct.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await transactionsContract.executeTransaction.sendTransactionAsync(transaction, randomSignature(), {
                    from: accounts[0],
                }),
            );
            const logs = receipt.logs as Array<LogWithDecodedArgs<TestTransactionsTransactionExecutionEventArgs>>;
            expect(logs.length).to.be.eq(1);
            expect(logs[0].event === 'TransactionExecution').to.be.true();
            expect(logs[0].args.transactionHash).to.eq(transactionHash);
        });
    });

    describe('getCurrentContext', () => {
        it('should return the sender address when there is not a saved context address', async () => {
            const currentContextAddress = await transactionsContract.getCurrentContextAddress.callAsync({
                from: accounts[0],
            });
            expect(currentContextAddress).to.be.eq(accounts[0]);
        });

        it('should return the sender address when there is a saved context address', async () => {
            // Set the current context address to the taker address
            await transactionsContract.setCurrentContextAddress.sendTransactionAsync(accounts[1]);

            // Ensure that the queried current context address is the same as the address that was set.
            const currentContextAddress = await transactionsContract.getCurrentContextAddress.callAsync({
                from: accounts[0],
            });
            expect(currentContextAddress).to.be.eq(accounts[1]);
        });
    });
});
// tslint:disable-line:max-file-line-count
