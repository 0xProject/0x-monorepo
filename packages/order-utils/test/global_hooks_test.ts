import { devConstants } from '@0xproject/dev-utils';
import { ArtifactWriter } from '@0xproject/migrations';
import { BigNumber } from '@0xproject/utils';

import { artifacts } from '../src/artifacts';
import { constants } from '../src/constants';
import { DummyERC20TokenContract } from '../src/generated_contract_wrappers/dummy_e_r_c20_token';
import { ERC20ProxyContract } from '../src/generated_contract_wrappers/e_r_c20_proxy';

import { provider } from './utils/web3_wrapper';

before('migrate contracts', async function(): Promise<void> {
    // HACK: Since contract migrations take longer then our global mocha timeout limit
    // we manually increase it for this before hook.
    const mochaTestTimeoutMs = 20000;
    this.timeout(mochaTestTimeoutMs);

    const txDefaults = {
        gas: devConstants.GAS_LIMIT,
        from: devConstants.TESTRPC_FIRST_ADDRESS,
    };

    const networkId = constants.TESTRPC_NETWORK_ID;
    const artifactsDir = `lib/src/artifacts`;
    const artifactsWriter = new ArtifactWriter(artifactsDir, networkId);

    const erc20proxy = await ERC20ProxyContract.deployFrom0xArtifactAsync(artifacts.ERC20Proxy, provider, txDefaults);
    artifactsWriter.saveArtifact(erc20proxy);

    const totalSupply = new BigNumber(100000000000000000000);
    const name = 'Test';
    const symbol = 'TST';
    const decimals = new BigNumber(18);
    // tslint:disable-next-line:no-unused-variable
    const dummyErc20Token = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
        artifacts.DummyERC20Token,
        provider,
        txDefaults,
        name,
        symbol,
        decimals,
        totalSupply,
    );
    artifactsWriter.saveArtifact(dummyErc20Token);
});
