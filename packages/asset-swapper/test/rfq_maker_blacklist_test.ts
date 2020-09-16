import * as chai from 'chai';
import 'mocha';

import { constants } from '../src/constants';
import { RfqMakerBlacklist } from '../src/utils/rfq_maker_blacklist';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('RfqMakerBlacklist', () => {
    it('does blacklist', async () => {
        const blacklistDurationMinutes = 1;
        const timeoutStreakThreshold = 3;
        const blacklist = new RfqMakerBlacklist(blacklistDurationMinutes, timeoutStreakThreshold);
        blacklist.logTimeoutOrLackThereof('makerA', true);
        blacklist.logTimeoutOrLackThereof('makerA', true);
        expect(blacklist.isMakerBlacklisted('makerA')).to.be.false();
        blacklist.logTimeoutOrLackThereof('makerA', true);
        const sleepTimeMs = 10;
        await new Promise<void>(r => {
            setTimeout(r, sleepTimeMs);
        });
        expect(blacklist.isMakerBlacklisted('makerA')).to.be.true();
    });
    it('does unblacklist', async () => {
        const blacklistDurationMinutes = 0.1;
        const timeoutStreakThreshold = 3;
        const blacklist = new RfqMakerBlacklist(blacklistDurationMinutes, timeoutStreakThreshold);
        blacklist.logTimeoutOrLackThereof('makerA', true);
        blacklist.logTimeoutOrLackThereof('makerA', true);
        blacklist.logTimeoutOrLackThereof('makerA', true);
        expect(blacklist.isMakerBlacklisted('makerA')).to.be.true();
        await new Promise<void>(r => {
            setTimeout(r, blacklistDurationMinutes * constants.ONE_MINUTE_MS);
        });
        expect(blacklist.isMakerBlacklisted('makerA')).to.be.false();
    });
});
