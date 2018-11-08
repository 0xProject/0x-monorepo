import 'reflect-metadata';
import { Connection, createConnection } from 'typeorm';

import { RelayerRegistrySource } from '../data_sources/relayer-registry';
import { Relayer } from '../entities';
import { deployConfig } from '../ormconfig';
import { parseRelayers } from '../parsers/relayer_registry';

// NOTE(albrow): We need to manually update this URL for now. Fix this when we
// have the relayer-registry behind semantic versioning.
const RELAYER_REGISTRY_URL =
    'https://raw.githubusercontent.com/0xProject/0x-relayer-registry/4701c85677d161ea729a466aebbc1826c6aa2c0b/relayers.json';

let connection: Connection;

(async () => {
    connection = await createConnection(deployConfig);
    await getRelayers();
    process.exit(0);
})();

async function getRelayers(): Promise<void> {
    console.log('Getting latest relayer info...');
    const relayerRepository = connection.getRepository(Relayer);
    const relayerSource = new RelayerRegistrySource(RELAYER_REGISTRY_URL);
    const relayersResp = await relayerSource.getRelayerInfoAsync();
    const relayers = parseRelayers(relayersResp);
    console.log('Saving relayer info...');
    await relayerRepository.save(relayers);
    console.log('Done saving relayer info.');
}
