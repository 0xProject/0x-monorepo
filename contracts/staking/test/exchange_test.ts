import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import * as _ from 'lodash';

import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('Exchange Integrations', env => {
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let exchange: string;
    // wrappers
    let stakingApiWrapper: StakingApiWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        // create accounts
        accounts = await env.getAccountAddressesAsync();
        owner = accounts[0];
        exchange = accounts[1];
        // set up ERC20Wrapper
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        // deploy staking contracts
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, owner, erc20Wrapper);
    });
    blockchainTests.resets('Exchange Tracking in Staking Contract', () => {
        it('basic exchange tracking', async () => {
            const { validExchanges, addExchangeAddress, removeExchangeAddress } = stakingApiWrapper.stakingContract;
            // 1 try querying an invalid addresses
            const invalidAddress = '0x0000000000000000000000000000000000000001';
            const isInvalidAddressValid = await validExchanges.callAsync(invalidAddress);
            expect(isInvalidAddressValid).to.be.false();
            // 2 add valid address
            await addExchangeAddress.awaitTransactionSuccessAsync(exchange);
            const isValidAddressValid = await validExchanges.callAsync(exchange);
            expect(isValidAddressValid).to.be.true();
            // 3 try adding valid address again
            let revertError = new StakingRevertErrors.ExchangeAddressAlreadyRegisteredError(exchange);
            let tx = addExchangeAddress.awaitTransactionSuccessAsync(exchange);
            await expect(tx).to.revertWith(revertError);
            // 4 remove valid address
            await removeExchangeAddress.awaitTransactionSuccessAsync(exchange);
            const isValidAddressStillValid = await validExchanges.callAsync(exchange);
            expect(isValidAddressStillValid).to.be.false();
            // 5 try removing valid address again
            revertError = new StakingRevertErrors.ExchangeAddressNotRegisteredError(exchange);
            tx = removeExchangeAddress.awaitTransactionSuccessAsync(exchange);
            await expect(tx).to.revertWith(revertError);
            // @todo should not be able to add / remove an exchange if not contract owner.
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
