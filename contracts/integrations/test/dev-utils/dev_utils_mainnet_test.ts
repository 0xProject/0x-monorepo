import { IChaiContract } from '@0x/contracts-asset-proxy';
import { artifacts as devUtilsArtifacts, DevUtilsContract } from '@0x/contracts-dev-utils';
import { ERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { contractAddresses } from '../mainnet_fork_utils';

blockchainTests.fork.resets('DevUtils mainnet tests', env => {
    const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const chaiAddress = '0x06af07097c9eeb7fd685c692751d5c66db49c215';
    const daiHolder = '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b';
    let noDaiAddress: string;

    const assetData = assetDataUtils.encodeERC20BridgeAssetData(
        daiAddress,
        contractAddresses.chaiBridge,
        constants.NULL_BYTES,
    );

    const dai = new ERC20TokenContract(daiAddress, env.provider, env.txDefaults);
    const chai = new IChaiContract(chaiAddress, env.provider, env.txDefaults);
    let devUtils: DevUtilsContract;
    const daiDepositAmount = Web3Wrapper.toBaseUnitAmount(1000, 18);

    before(async () => {
        [noDaiAddress] = await env.getAccountAddressesAsync();
        devUtils = await DevUtilsContract.deployFrom0xArtifactAsync(
            devUtilsArtifacts.DevUtils,
            env.provider,
            env.txDefaults,
            devUtilsArtifacts,
            contractAddresses.exchange,
            contractAddresses.chaiBridge,
        );
        await dai.approve(chai.address, constants.MAX_UINT256).awaitTransactionSuccessAsync({ from: daiHolder });
        await chai.join(daiHolder, daiDepositAmount).awaitTransactionSuccessAsync({ from: daiHolder });
    });

    describe('LibAssetData', () => {
        describe('ChaiBridge getBalance', () => {
            it('should return the correct non-zero Dai balance for a Chai holder', async () => {
                const expectedDaiBalance = await chai.dai(daiHolder).callAsync();
                const daiBalance = await devUtils.getBalance(daiHolder, assetData).callAsync();
                expect(daiBalance).bignumber.eq(expectedDaiBalance);
            });
            it('should return a balance of 0 when Chai balance is 0', async () => {
                const daiBalance = await devUtils.getBalance(noDaiAddress, assetData).callAsync();
                expect(daiBalance).bignumber.eq(constants.ZERO_AMOUNT);
            });
        });
        describe('ChaiBridge getProxyAllowance', () => {
            it('should return the correct non-zero non-unlimited allowance', async () => {
                const chaiBalance = await chai.balanceOf(daiHolder).callAsync();
                await chai
                    .approve(contractAddresses.chaiBridge, chaiBalance)
                    .awaitTransactionSuccessAsync({ from: daiHolder });
                const daiBalance = await chai.dai(daiHolder).callAsync();
                const allowance = await devUtils.getAssetProxyAllowance(daiHolder, assetData).callAsync();
                expect(allowance).to.bignumber.eq(daiBalance);
            });
            it('should return an unlimited allowance of Dai when Chai allowance is also unlimited', async () => {
                await chai
                    .approve(contractAddresses.chaiBridge, constants.MAX_UINT256)
                    .awaitTransactionSuccessAsync({ from: daiHolder });
                const allowance = await devUtils.getAssetProxyAllowance(daiHolder, assetData).callAsync();
                expect(allowance).to.bignumber.eq(constants.MAX_UINT256);
            });
            it('should return an allowance of 0 when Chai allowance is 0', async () => {
                const allowance = await devUtils.getAssetProxyAllowance(noDaiAddress, assetData).callAsync();
                expect(allowance).to.bignumber.eq(constants.ZERO_AMOUNT);
            });
        });
    });
});
