/**
 * Tracks a maker's history of timely responses, and manages whether a given
 * maker should be avoided for being too latent.
 */
export class RfqMakerBlacklist {
    // tslint:disable-next-line:custom-no-magic-numbers
    private static readonly _msPerMinute = 1000 * 60;
    private readonly _makerTimeoutStreakLength: { [makerUrl: string]: number } = {};
    private readonly _makerBlacklistedUntilDate: { [makerUrl: string]: number } = {};
    constructor(private readonly _blacklistDurationMinutes: number, private readonly _timeoutStreakThreshold: number) {}
    public logTimeoutOrLackThereof(makerUrl: string, didTimeout: boolean): void {
        if (!this._makerTimeoutStreakLength.hasOwnProperty(makerUrl)) {
            this._makerTimeoutStreakLength[makerUrl] = 0;
        }
        if (didTimeout) {
            this._makerTimeoutStreakLength[makerUrl] += 1;
            if (this._makerTimeoutStreakLength[makerUrl] > this._timeoutStreakThreshold) {
                this._makerBlacklistedUntilDate[makerUrl] =
                    Date.now() + this._blacklistDurationMinutes * RfqMakerBlacklist._msPerMinute;
                this._makerTimeoutStreakLength[makerUrl] = 0;
            }
        } else {
            this._makerTimeoutStreakLength[makerUrl] = 0;
        }
    }
    public isMakerBlacklisted(makerUrl: string): boolean {
        if (this._makerBlacklistedUntilDate.hasOwnProperty(makerUrl)) {
            if (this._makerBlacklistedUntilDate[makerUrl] > Date.now()) {
                delete this._makerBlacklistedUntilDate[makerUrl];
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }
}
