import { BlockchainLifecycle, devConstants, web3Factory } from '@0x/dev-utils';
import { EthRPCClient } from '@0x/eth-rpc-client';
import { FillScenarios } from '@0x/fill-scenarios';
import { runMigrationsAsync } from '@0x/migrations';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { ContractWrappers } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { tokenUtils } from './utils/token_utils';

chaiSetup.configure();
const expect = chai.expect;

describe('Revert Validation ExchangeWrapper', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
    let fillScenarios: FillScenarios;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAddress: string;
    let takerAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let txHash: string;
    let blockchainLifecycle: BlockchainLifecycle;
    let ethRPCClient: EthRPCClient;
    const fillableAmount = new BigNumber(5);
    const takerTokenFillAmount = new BigNumber(5);
    let signedOrder: SignedOrder;
    before(async () => {
        // vmErrorsOnRPCResponse is useful for quick feedback and testing during development
        // but is not the default behaviour in production. Here we ensure our failure cases
        // are handled in an environment which behaves similar to production
        const provider = web3Factory.getRpcProvider({
            shouldUseInProcessGanache: true,
            shouldThrowErrorsOnGanacheRPCResponse: false,
        });
        ethRPCClient = new EthRPCClient(provider);
        blockchainLifecycle = new BlockchainLifecycle(ethRPCClient);
        // Re-deploy the artifacts in this provider, rather than in the default provider exposed in
        // the beforeAll hook. This is due to the fact that the default provider enabled vmErrorsOnRPCResponse
        // and we are explicity testing with vmErrorsOnRPCResponse disabled.
        const txDefaults = {
            gas: devConstants.GAS_LIMIT,
            from: devConstants.TESTRPC_FIRST_ADDRESS,
        };
        await blockchainLifecycle.startAsync();
        const contractAddresses = await runMigrationsAsync(provider, txDefaults);
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses,
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        userAddresses = await ethRPCClient.getAvailableAddressesAsync();
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            contractAddresses.zrxToken,
            contractAddresses.exchange,
            contractAddresses.erc20Proxy,
            contractAddresses.erc721Proxy,
        );
        [, makerAddress, takerAddress] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];
        signedOrder = await fillScenarios.createFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            takerAddress,
            fillableAmount,
        );
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#fillOrderAsync', () => {
        it('should throw the revert reason when shouldValidate is true and a fill would revert', async () => {
            // Create a scenario where the fill will revert
            const makerTokenBalance = await contractWrappers.erc20Token.getBalanceAsync(
                makerTokenAddress,
                makerAddress,
            );
            // Transfer all of the tokens from maker to create a failure scenario
            txHash = await contractWrappers.erc20Token.transferAsync(
                makerTokenAddress,
                makerAddress,
                takerAddress,
                makerTokenBalance,
            );
            await ethRPCClient.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            return expect(
                contractWrappers.exchange.fillOrderAsync(signedOrder, takerTokenFillAmount, takerAddress, {
                    shouldValidate: true,
                }),
            ).to.be.rejectedWith('TRANSFER_FAILED');
        });
    });
});
