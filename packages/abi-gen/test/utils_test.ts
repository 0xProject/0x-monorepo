import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as fs from 'fs';
import 'mocha';
import * as sleep from 'sleep';
import * as tmp from 'tmp';

import { utils } from '../src/utils';

tmp.setGracefulCleanup(); // remove tmp files even if there are failures

chai.use(dirtyChai);

const expect = chai.expect;

const SLEEP_MS = 10; // time to wait before re-timestamping a file

describe('makeOutputFileName()', () => {
    it('should handle Metacoin usage', () => {
        expect(utils.makeOutputFileName('Metacoin')).to.equal('metacoin');
    });
    it('should handle special zrx_token case', () => {
        expect(utils.makeOutputFileName('ZRXToken')).to.equal('zrx_token');
    });
    it('should handle special erc_token case', () => {
        expect(utils.makeOutputFileName('ERC20Token')).to.equal('erc20_token');
    });
});

describe('writeOutputFile()', () => {
    let tempFilePath: string;
    before(() => {
        tempFilePath = tmp.fileSync(
            { discardDescriptor: true }, // close file (so we can update it)
        ).name;
    });
    it('should write content to output file', () => {
        const content = 'hello world';

        utils.writeOutputFile(tempFilePath, content);

        expect(fs.readFileSync(tempFilePath).toString()).to.equal(content);
    });
});

describe('isOutputFileUpToDate()', () => {
    it('should throw ENOENT when there is no abi file', () => {
        expect(utils.isOutputFileUpToDate.bind('nonexistant1', 'nonexistant2')).to.throw('ENOENT');
    });

    describe('when the abi input file exists', () => {
        let abiFile: string;
        before(() => {
            abiFile = tmp.fileSync(
                { discardDescriptor: true }, // close file (set timestamp)
            ).name;
        });

        describe('without an existing output file', () => {
            it('should return false', () => {
                expect(utils.isOutputFileUpToDate(abiFile, 'nonexistant_file')).to.be.false();
            });
        });

        describe('with an existing output file', () => {
            let outputFile: string;
            before(() => {
                sleep.msleep(SLEEP_MS); // to ensure different timestamp
                outputFile = tmp.fileSync(
                    { discardDescriptor: true }, // close file (set timestamp)
                ).name;
            });

            it('should return true when output file and is newer than abi file', async () => {
                expect(utils.isOutputFileUpToDate(abiFile, outputFile)).to.be.true();
            });

            it('should return false when output file exists but is older than abi file', () => {
                sleep.msleep(SLEEP_MS); // to ensure different timestamp
                fs.closeSync(fs.openSync(abiFile, 'w')); // touch abi file

                expect(utils.isOutputFileUpToDate(abiFile, outputFile)).to.be.false();
            });
        });
    });
});
