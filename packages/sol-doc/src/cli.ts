import 'source-map-support/register';
import * as yargs from 'yargs';

import { logUtils } from '@0x/utils';

import { SolDoc } from './sol_doc';

const JSON_TAB_WIDTH = 4;

(async () => {
    const argv = yargs
        .option('contracts-dir', {
            type: 'string',
            description: 'path of contracts directory to compile',
        })
        .option('contracts', {
            type: 'string',
            description: 'comma separated list of contracts to compile',
        })
        .demandOption('contracts-dir')
        .array('contracts')
        .help().argv;
    // Unfortunately, the only way to currently retrieve the declared structs within Solidity contracts
    // is to tease them out of the params/return values included in the ABI. These structures do
    // not include the structs actual name, so we need a mapping to assign the proper name to a
    // struct. If the name is not in this mapping, the structs name will default to the param/return value
    // name (which mostly coincide).
    const customTypeHashToName: { [hash: string]: string } = {
        '52d4a768701076c7bac06e386e430883975eb398732eccba797fd09dd064a60e': 'Order',
        '46f7e8c4d144d11a72ce5338458ea37b933500d7a65e740cbca6d16e350eaa48': 'FillResults',
        c22239cf0d29df1e6cf1be54f21692a8c0b3a48b9367540d4ffff4608b331ce9: 'OrderInfo',
        c21e9ff31a30941c22e1cb43752114bb467c34dea58947f98966c9030fc8e4a9: 'TraderInfo',
        '6de3264a1040e027d4bdd29c71e963028238ac4ef060541078a7aced44a4d46f': 'MatchedFillResults',
    };
    const solDoc = new SolDoc();
    const doc = await solDoc.generateSolDocAsync(argv.contractsDir, argv.contracts, customTypeHashToName);
    process.stdout.write(JSON.stringify(doc, null, JSON_TAB_WIDTH));
})().catch(err => {
    logUtils.warn(err);
    process.exit(1);
});
