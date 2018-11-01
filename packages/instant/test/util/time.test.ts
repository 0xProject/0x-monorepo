import { timeUtil } from '../../src/util/time';

describe('timeUtil', () => {
    describe('secondsToHumanDescription', () => {
        const numsToResults: {
            [aNumber: number]: string;
        } = {
            1: '1 second',
            59: '59 seconds',
            60: '1 minute',
            119: '1 minute 59 seconds',
            120: '2 minutes',
            121: '2 minutes 1 second',
            122: '2 minutes 2 seconds',
        };

        const nums = Object.keys(numsToResults);
        nums.forEach(aNum => {
            const numInt = parseInt(aNum, 10);
            it(`should work for ${aNum} seconds`, () => {
                const expectedResult = numsToResults[numInt];
                expect(timeUtil.secondsToHumanDescription(numInt)).toEqual(expectedResult);
            });
        });
    });
    describe('secondsToStopwatchTime', () => {
        const numsToResults: {
            [aNumber: number]: string;
        } = {
            1: '00:01',
            59: '00:59',
            60: '01:00',
            119: '01:59',
            120: '02:00',
            121: '02:01',
            2701: '45:01',
        };

        const nums = Object.keys(numsToResults);
        nums.forEach(aNum => {
            const numInt = parseInt(aNum, 10);
            it(`should work for ${aNum} seconds`, () => {
                const expectedResult = numsToResults[numInt];
                expect(timeUtil.secondsToStopwatchTime(numInt)).toEqual(expectedResult);
            });
        });
    });
});
