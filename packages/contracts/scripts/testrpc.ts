import * as testrpc from 'ganache-cli';
import * as _ from 'lodash';

import { constants } from '../src/utils/constants';
import { utils } from '../src/utils/utils';

const opts = {
    accounts: constants.TESTRPC_ACCOUNTS,
    logger: console,
};

const server = testrpc.server(opts);

server.listen(constants.TESTRPC_PORT, (err: any, result: any) => {
    if (err) {
        utils.consoleLog(err);
        return;
    }

    const state = result ? result : server.provider.manager.state;

    utils.consoleLog('');
    utils.consoleLog('Available Accounts');
    utils.consoleLog('==================');

    const accounts = state.accounts;
    const addresses = _.keys(accounts);

    _.forEach(addresses, (address, index) => {
        const line = `(${index}) ${address}`;
        utils.consoleLog(line);
    });

    utils.consoleLog('');
    utils.consoleLog('Private Keys');
    utils.consoleLog('==================');

    _.forEach(addresses, (address, index) => {
        utils.consoleLog(`(${index}) ${accounts[address].secretKey.toString('hex')}`);
    });

    utils.consoleLog('');
    utils.consoleLog('Listening on localhost:' + constants.TESTRPC_PORT);
});
