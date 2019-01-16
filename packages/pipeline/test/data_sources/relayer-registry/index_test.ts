import * as chai from 'chai';
import 'mocha';

import { getRelayerInfoAsync, RelayerResponses } from '../../../src/data_sources/relayer-registry';
import { chaiSetup } from '../../utils/chai_setup';

const RELAYER_REGISTRY_URL =
    'https://raw.githubusercontent.com/0xProject/0x-relayer-registry/4701c85677d161ea729a466aebbc1826c6aa2c0b/relayers.json';

chaiSetup.configure();
const expect = chai.expect;

describe('Relayer registry data source', () => {
    it('should contain Radar Relay', async () => {
        const relayers: RelayerResponses = await getRelayerInfoAsync(RELAYER_REGISTRY_URL);

        const radarUuid = 'e8d27d8d-ddf6-48b1-9663-60b0a3ddc716';

        expect(radarUuid in relayers).to.be.true();

        const radarEntry = relayers[radarUuid];
        expect(radarEntry.name).to.equal('Radar Relay');
    });
});
