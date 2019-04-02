import { RichRevertReason } from '@0x/utils';
import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import ChaiBigNumber = require('chai-bignumber');
import * as dirtyChai from 'dirty-chai';

export const chaiSetup = {
    configure(): void {
        chai.config.includeStack = true;
        chai.use(ChaiBigNumber());
        chai.use(dirtyChai);
        chai.use(chaiAsPromised);
        chai.use(richRevertEquality);
    },
};

function richRevertEquality(_chai: any): void {
    // tslint:disable:only-arrow-functions
    const Assertion = _chai.Assertion;
    Assertion.overwriteMethod('rejectedWith', function(_super: (x: any) => Promise<void>): (b: any) => Promise<void> {
        return async function(this: any, b: any | RichRevertReason): Promise<void> {
            const p = this._obj;
            let a;
            try {
                if (p instanceof Promise) {
                    await p;
                    this.assert(false, 'Expected promise to reject');
                } else {
                    a = p;
                }
            } catch (err) {
                a = err;
            }
            if (b instanceof RichRevertReason) {
                // Try to decode the result as a rich revert reason.
                if (a instanceof Buffer) {
                    const hex = a.toString('hex');
                    a = `0x${hex}`;
                }
                if (typeof a === 'string') {
                    a = RichRevertReason.decode(a);
                }
                if (a instanceof RichRevertReason) {
                    this.assert(a.equals(b), `${a} != ${b}`);
                }
            }
            _super.call(this, b);
        };
    });
}
