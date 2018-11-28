import 'mocha';
import * as R from 'ramda';
import 'reflect-metadata';

import { Relayer } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

const baseRelayer = {
    uuid: 'e8d27d8d-ddf6-48b1-9663-60b0a3ddc716',
    name: 'Radar Relay',
    homepageUrl: 'https://radarrelay.com',
    appUrl: null,
    sraHttpEndpoint: null,
    sraWsEndpoint: null,
    feeRecipientAddresses: [],
    takerAddresses: [],
};

const relayerWithUrls = R.merge(baseRelayer, {
    uuid: 'e8d27d8d-ddf6-48b1-9663-60b0a3ddc717',
    appUrl: 'https://app.radarrelay.com',
    sraHttpEndpoint: 'https://api.radarrelay.com/0x/v2/',
    sraWsEndpoint: 'wss://ws.radarrelay.com/0x/v2',
});

const relayerWithAddresses = R.merge(baseRelayer, {
    uuid: 'e8d27d8d-ddf6-48b1-9663-60b0a3ddc718',
    feeRecipientAddresses: [
        '0xa258b39954cef5cb142fd567a46cddb31a670124',
        '0xa258b39954cef5cb142fd567a46cddb31a670125',
        '0xa258b39954cef5cb142fd567a46cddb31a670126',
    ],
    takerAddresses: [
        '0xa258b39954cef5cb142fd567a46cddb31a670127',
        '0xa258b39954cef5cb142fd567a46cddb31a670128',
        '0xa258b39954cef5cb142fd567a46cddb31a670129',
    ],
});

// tslint:disable:custom-no-magic-numbers
describe('Relayer entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const relayers = [baseRelayer, relayerWithUrls, relayerWithAddresses];
        const relayerRepository = connection.getRepository(Relayer);
        for (const relayer of relayers) {
            await testSaveAndFindEntityAsync(relayerRepository, relayer);
        }
    });
});
