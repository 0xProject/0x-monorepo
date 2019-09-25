import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { AuthorizableRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts, TestExchangeManagerContract } from '../../src';

blockchainTests.resets.only('Exchange Unit Tests', env => {
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
        await exchangeManager.setValidExchange.awaitTransactionSuccessAsync(exchange);

        // Register an authority.
        await exchangeManager.addAuthorizedAddress.awaitTransactionSuccessAsync(authority, { from: owner });
    });

    describe('onlyExchange', () => {
        it('should revert if called by an unregistered exchange', async () => {
            const expectedError = new StakingRevertErrors.OnlyCallableByExchangeError(nonExchange);
            return expect(exchangeManager.onlyExchangeFunction.callAsync({ from: nonExchange })).to.revertWith(
                expectedError,
            );
        });

        it('should succeed if called by a registered exchange', async () => {
            const didSucceed = await exchangeManager.onlyExchangeFunction.callAsync({ from: exchange });
            expect(didSucceed).to.be.true();
        });
    });

    describe('addExchangeAddress', () => {
        it('should revert if called by an unauthorized address', async () => {
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(nonAuthority);
            const tx = exchangeManager.addExchangeAddress.awaitTransactionSuccessAsync(nonExchange, {
                from: nonAuthority,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should successfully add an exchange if called by the (authorized) owner', async () => {
            // Register a new exchange.
            await exchangeManager.addExchangeAddress.awaitTransactionSuccessAsync(nonExchange, { from: owner });

            // Ensure that the exchange was successfully registered.
            const isValidExchange = await exchangeManager.validExchanges.callAsync(nonExchange);
            expect(isValidExchange).to.be.true();
        });

        it('should successfully add an exchange if called by an authorized address', async () => {
            // Register a new exchange.
            await exchangeManager.addExchangeAddress.awaitTransactionSuccessAsync(nonExchange, { from: authority });

            // Ensure that the exchange was successfully registered.
            const isValidExchange = await exchangeManager.validExchanges.callAsync(nonExchange);
            expect(isValidExchange).to.be.true();
        });

        it('should fail to add an exchange redundantly', async () => {
            const expectedError = new StakingRevertErrors.ExchangeManagerError(
                StakingRevertErrors.ExchangeManagerErrorCodes.ExchangeAlreadyRegistered,
                exchange,
            );
            const tx = exchangeManager.addExchangeAddress.awaitTransactionSuccessAsync(exchange, { from: authority });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('removeExchangeAddress', () => {
        it('should revert if called by an unauthorized address', async () => {
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(nonAuthority);
            const tx = exchangeManager.removeExchangeAddress.awaitTransactionSuccessAsync(exchange, {
                from: nonAuthority,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should successfully remove an exchange if called by the (authorized) owner', async () => {
            // Remove the registered exchange.
            await exchangeManager.removeExchangeAddress.awaitTransactionSuccessAsync(exchange, { from: owner });

            // Ensure that the exchange was removed.
            const isValidExchange = await exchangeManager.validExchanges.callAsync(exchange);
            expect(isValidExchange).to.be.false();
        });

        it('should successfully remove a registered exchange if called by an authorized address', async () => {
            // Remove the registered exchange.
            await exchangeManager.removeExchangeAddress.awaitTransactionSuccessAsync(exchange, { from: authority });

            // Ensure that the exchange was removed.
            const isValidExchange = await exchangeManager.validExchanges.callAsync(exchange);
            expect(isValidExchange).to.be.false();
        });

        it('should fail to remove an exchange redundantly', async () => {
            const expectedError = new StakingRevertErrors.ExchangeManagerError(
                StakingRevertErrors.ExchangeManagerErrorCodes.ExchangeNotRegistered,
                nonExchange,
            );
            const tx = exchangeManager.removeExchangeAddress.awaitTransactionSuccessAsync(nonExchange, {
                from: authority,
            });
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
