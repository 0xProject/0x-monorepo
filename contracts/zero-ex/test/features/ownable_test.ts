import { blockchainTests, expect, randomAddress, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { OwnableRevertErrors } from '@0x/utils';

import { initialMigrateAsync } from '../utils/migration';
import { IOwnableContract, IOwnableEvents } from '../wrappers';

blockchainTests.resets('Ownable feature', env => {
    const notOwner = randomAddress();
    let owner: string;
    let ownable: IOwnableContract;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        const zeroEx = await initialMigrateAsync(owner, env.provider, env.txDefaults);
        ownable = new IOwnableContract(zeroEx.address, env.provider, env.txDefaults);
    });

    describe('transferOwnership()', () => {
        it('non-owner cannot transfer ownership', async () => {
            const newOwner = randomAddress();
            const tx = ownable.transferOwnership(newOwner).callAsync({ from: notOwner });
            return expect(tx).to.revertWith(new OwnableRevertErrors.OnlyOwnerError(notOwner, owner));
        });

        it('owner can transfer ownership', async () => {
            const newOwner = randomAddress();
            const receipt = await ownable.transferOwnership(newOwner).awaitTransactionSuccessAsync({ from: owner });
            verifyEventsFromLogs(
                receipt.logs,
                [
                    {
                        previousOwner: owner,
                        newOwner,
                    },
                ],
                IOwnableEvents.OwnershipTransferred,
            );
            expect(await ownable.getOwner().callAsync()).to.eq(newOwner);
        });
    });
});
