import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { AuthorizableRevertErrors } from '@0x/contracts-utils';
import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { StakingRevertErrors } from '../../src';

import { artifacts } from '../artifacts';
import {
    TestExchangeManagerContract,
    TestExchangeManagerExchangeAddedEventArgs,
    TestExchangeManagerExchangeRemovedEventArgs,
} from '../wrappers';

blockchainTests.resets('Exchange Unit Tests', env => {
    // Addresses
    let nonOwner: string;
    let owner: string;
    let nonExchange: string;
    let exchange: string;
    let nonAuthority: string;
    let authority: string;

    // Exchange Manager
    let exchangeManager: TestExchangeManagerContract;

    before(async () => {
        // Set up addresses for testing.
        [nonOwner, owner, nonExchange, exchange, nonAuthority, authority] = await env.getAccountAddressesAsync();

        // Deploy the Exchange Manager contract.
        exchangeManager = await TestExchangeManagerContract.deployFrom0xArtifactAsync(
            artifacts.TestExchangeManager,
            env.provider,
            {
                ...env.txDefaults,
                from: owner,
            },
            artifacts,
        );

        // Register the exchange.
        await exchangeManager.setValidExchange(exchange).awaitTransactionSuccessAsync();

        // Register an authority.
        await exchangeManager.addAuthorizedAddress(authority).awaitTransactionSuccessAsync({ from: owner });
    });

    describe('onlyExchange', () => {
        it('should revert if called by an unregistered exchange', async () => {
            const expectedError = new StakingRevertErrors.OnlyCallableByExchangeError(nonExchange);
            return expect(exchangeManager.onlyExchangeFunction().callAsync({ from: nonExchange })).to.revertWith(
                expectedError,
            );
        });

        it('should succeed if called by a registered exchange', async () => {
            const didSucceed = await exchangeManager.onlyExchangeFunction().callAsync({ from: exchange });
            expect(didSucceed).to.be.true();
        });
    });

    enum ExchangeManagerEventType {
        ExchangeAdded,
        ExchangeRemoved,
    }

    // Verify the logs emitted by `addExchangeAddress` and `removeExchangeAddress`
    function verifyExchangeManagerEvent(
        eventType: ExchangeManagerEventType,
        exchangeAddress: string,
        receipt: TransactionReceiptWithDecodedLogs,
    ): void {
        // Ensure that the length of the logs is correct.
        expect(receipt.logs.length).to.be.eq(1);

        // Ensure that the event emitted was correct.
        let log;
        // tslint:disable:no-unnecessary-type-assertion
        if (eventType === ExchangeManagerEventType.ExchangeAdded) {
            log = receipt.logs[0] as LogWithDecodedArgs<TestExchangeManagerExchangeAddedEventArgs>;
            expect(log.event).to.be.eq('ExchangeAdded');
        } else {
            log = receipt.logs[0] as LogWithDecodedArgs<TestExchangeManagerExchangeRemovedEventArgs>;
            expect(log.event).to.be.eq('ExchangeRemoved');
        }
        // tslint:enable:no-unnecessary-type-assertion
        expect(log.args.exchangeAddress).to.be.eq(exchangeAddress);
    }

    describe('addExchangeAddress', () => {
        it('should revert if called by an unauthorized address', async () => {
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(nonAuthority);
            const tx = exchangeManager.addExchangeAddress(nonExchange).awaitTransactionSuccessAsync({
                from: nonAuthority,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when adding an exchange if called by the (non-authorized) owner', async () => {
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(owner);
            const tx = exchangeManager.addExchangeAddress(nonExchange).awaitTransactionSuccessAsync({
                from: owner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should successfully add an exchange if called by an authorized address', async () => {
            // Register a new exchange.
            const receipt = await exchangeManager.addExchangeAddress(nonExchange).awaitTransactionSuccessAsync({
                from: authority,
            });

            // Ensure that the logged event was correct.
            verifyExchangeManagerEvent(ExchangeManagerEventType.ExchangeAdded, nonExchange, receipt);

            // Ensure that the exchange was successfully registered.
            const isValidExchange = await exchangeManager.validExchanges(nonExchange).callAsync();
            expect(isValidExchange).to.be.true();
        });

        it('should fail to add an exchange redundantly', async () => {
            const expectedError = new StakingRevertErrors.ExchangeManagerError(
                StakingRevertErrors.ExchangeManagerErrorCodes.ExchangeAlreadyRegistered,
                exchange,
            );
            const tx = exchangeManager.addExchangeAddress(exchange).awaitTransactionSuccessAsync({ from: authority });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('removeExchangeAddress', () => {
        it('should revert if called by an unauthorized address', async () => {
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(nonAuthority);
            const tx = exchangeManager.removeExchangeAddress(exchange).awaitTransactionSuccessAsync({
                from: nonAuthority,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert when removing an exchange if called by the (non-authorized) owner', async () => {
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(owner);
            const tx = exchangeManager.removeExchangeAddress(nonExchange).awaitTransactionSuccessAsync({
                from: owner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should successfully remove a registered exchange if called by an authorized address', async () => {
            // Remove the registered exchange.
            const receipt = await exchangeManager.removeExchangeAddress(exchange).awaitTransactionSuccessAsync({
                from: authority,
            });

            // Ensure that the logged event was correct.
            verifyExchangeManagerEvent(ExchangeManagerEventType.ExchangeRemoved, exchange, receipt);

            // Ensure that the exchange was removed.
            const isValidExchange = await exchangeManager.validExchanges(exchange).callAsync();
            expect(isValidExchange).to.be.false();
        });

        it('should fail to remove an exchange redundantly', async () => {
            const expectedError = new StakingRevertErrors.ExchangeManagerError(
                StakingRevertErrors.ExchangeManagerErrorCodes.ExchangeNotRegistered,
                nonExchange,
            );
            const tx = exchangeManager.removeExchangeAddress(nonExchange).awaitTransactionSuccessAsync({
                from: authority,
            });
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
