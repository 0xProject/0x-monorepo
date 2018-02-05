import { DecodedLogEvent, ExchangeEvents, LogFillContractEventArgs, ZeroEx } from '0x.js';
import * as _ from 'lodash';
import * as Web3 from 'web3';

const zeroExConfig = {
    networkId: 1,
};

const RPC_URL = 'https://mainnet.infura.io/T5WSC8cautR4KXyYgsRs';
// const RPC_URL = 'https://mainnet.0xproject.com';

const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));
const zeroEx = new ZeroEx(web3.currentProvider, zeroExConfig);

const subscribe = () => {
    console.log('subscribing...');
    zeroEx.exchange.subscribe<LogFillContractEventArgs>(
        ExchangeEvents.LogFill,
        {},
        (err: Error | null, event?: DecodedLogEvent<LogFillContractEventArgs>) => {
            if (_.isNull(err)) {
                console.log('EVENT');
                console.log(event);
            } else {
                console.log('ERROR');
                console.log(err);
                subscribe();
            }
        },
    );
};
subscribe();
