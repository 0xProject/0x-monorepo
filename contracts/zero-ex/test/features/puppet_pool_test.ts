import { blockchainTests, constants, expect, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { ZeroExRevertErrors } from '@0x/utils';

import { artifacts } from '../artifacts';
import { abis } from '../utils/abis';
import { fullMigrateAsync } from '../utils/migration';
import { IPuppetPoolEvents, PuppetContract, PuppetPoolContract, ZeroExContract } from '../wrappers';

blockchainTests.resets('PuppetPool feature', env => {
    let zeroEx: ZeroExContract;
    let feature: PuppetPoolContract;
    let unmanagedPuppet: PuppetContract;

    before(async () => {
        const [owner] = await env.getAccountAddressesAsync();
        zeroEx = await fullMigrateAsync(owner, env.provider, env.txDefaults, {
            puppetPool: (await PuppetContract.deployFrom0xArtifactAsync(
                artifacts.TestPuppetPool,
                env.provider,
                env.txDefaults,
                artifacts,
            )).address,
        });
        feature = new PuppetPoolContract(zeroEx.address, env.provider, env.txDefaults, abis);
        unmanagedPuppet = await PuppetContract.deployFrom0xArtifactAsync(
            artifacts.Puppet,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    async function acquirePuppetAsync(): Promise<PuppetContract> {
        const puppet = new PuppetContract(
            await feature._acquirePuppet().callAsync(),
            env.provider,
            env.txDefaults,
            abis,
        );
        await feature._acquirePuppet().awaitTransactionSuccessAsync();
        return puppet;
    }

    async function releasePuppetAsync(puppet: string | PuppetContract): Promise<void> {
        await feature
            ._releasePuppet(typeof puppet === 'string' ? puppet : puppet.address)
            .awaitTransactionSuccessAsync();
    }

    describe('_acquirePuppet() and _releasePuppet()', () => {
        it('_acquirePuppet() creates a new puppet if none are available', async () => {
            const acquiredPuppets = [];
            while ((await feature.getFreePuppetsCount().callAsync()).gt(0)) {
                acquiredPuppets.push(await acquirePuppetAsync());
            }
            const puppetAddress = await feature._acquirePuppet().callAsync();
            const receipt = await feature._acquirePuppet().awaitTransactionSuccessAsync();
            expect(puppetAddress).to.not.eq(constants.NULL_ADDRESS);
            verifyEventsFromLogs(receipt.logs, [{ puppet: puppetAddress }], IPuppetPoolEvents.PuppetCreated);
        });

        it('_acquirePuppet() returns a free puppet if available', async () => {
            const freePuppetAddess = await feature.createFreePuppet().callAsync();
            await feature.createFreePuppet().awaitTransactionSuccessAsync();
            // Acquire the free puppet.
            const puppetAddress = await feature._acquirePuppet().callAsync();
            const receipt = await feature._acquirePuppet().awaitTransactionSuccessAsync();
            expect(await feature.getFreePuppetsCount().callAsync()).to.bignumber.eq(0);
            expect(puppetAddress).to.eq(freePuppetAddess);
            verifyEventsFromLogs(receipt.logs, [], IPuppetPoolEvents.PuppetCreated);
        });

        it('can release an EXISTING puppet returned by _acquirePuppet()', async () => {
            const freePuppetAddess = await feature.createFreePuppet().callAsync();
            await feature.createFreePuppet().awaitTransactionSuccessAsync();
            // Acquire the free puppet.
            const puppetAddress = await feature._acquirePuppet().callAsync();
            await feature._acquirePuppet().awaitTransactionSuccessAsync();
            expect(await feature.getFreePuppetsCount().callAsync()).to.bignumber.eq(0);
            expect(puppetAddress).to.eq(freePuppetAddess);
            await releasePuppetAsync(puppetAddress);
            expect(await feature.getFreePuppetsCount().callAsync()).to.bignumber.eq(1);
        });

        it('can acquire and release many puppets', async () => {
            const puppets = [];
            for (let i = 0; i < 8; ++i) {
                puppets.push(await acquirePuppetAsync());
            }
            expect(await feature.getFreePuppetsCount().callAsync()).to.bignumber.eq(0);
            for (const puppet of puppets) {
                await releasePuppetAsync(puppet);
            }
            expect(await feature.getFreePuppetsCount().callAsync()).to.bignumber.eq(puppets.length);
        });

        it('cannot release a puppet not created by the pool', async () => {
            return expect(releasePuppetAsync(unmanagedPuppet)).to.revertWith(
                new ZeroExRevertErrors.Puppet.InvalidPuppetInstanceError(unmanagedPuppet.address),
            );
        });

        it('cannot release a free puppet', async () => {
            const puppet = await acquirePuppetAsync();
            await releasePuppetAsync(puppet);
            return expect(releasePuppetAsync(puppet)).to.revertWith(
                new ZeroExRevertErrors.Puppet.PuppetNotAcquiredError(puppet.address),
            );
        });
    });

    describe('createFreePuppet()', () => {
        it('creates a free puppet', async () => {
            const puppet = await feature.createFreePuppet().callAsync();
            const receipt = await feature.createFreePuppet().awaitTransactionSuccessAsync();
            verifyEventsFromLogs(receipt.logs, [{ puppet }], IPuppetPoolEvents.PuppetCreated);
            expect(await feature.isPuppet(puppet).callAsync()).to.eq(true);
            expect(await feature.getFreePuppetsCount().callAsync()).to.bignumber.eq(1);
        });
    });

    describe('isPuppet()', () => {
        it('returns false for a puppet not created by the pool', async () => {
            expect(await feature.isPuppet(unmanagedPuppet.address).callAsync()).to.eq(false);
        });

        it('returns true for an acquired puppet', async () => {
            const puppet = await acquirePuppetAsync();
            expect(await feature.isPuppet(puppet.address).callAsync()).to.eq(true);
        });

        it('returns true for a released puppet', async () => {
            const puppet = await acquirePuppetAsync();
            await releasePuppetAsync(puppet);
            expect(await feature.isPuppet(puppet.address).callAsync()).to.eq(true);
        });
    });

    describe('puppets', () => {
        it('puppet is owned by proxy contract', async () => {
            const puppet = await acquirePuppetAsync();
            expect(await puppet.owner().callAsync()).to.eq(zeroEx.address);
        });

        it('proxy contract is authorized', async () => {
            const puppet = await acquirePuppetAsync();
            expect(await puppet.authorized(zeroEx.address).callAsync()).to.eq(true);
        });
    });
});
