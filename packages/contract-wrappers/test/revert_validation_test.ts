import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { FillScenarios } from '@0xproject/fill-scenarios';
import { getContractAddresses } from '@0xproject/migrations';
import { assetDataUtils } from '@0xproject/order-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import 'mocha';

import { ContractWrappers } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { tokenUtils } from './utils/token_utils';

chaiSetup.configure();
const expect = chai.expect;

// TODO(albrow): Re-enable these tests after @0xproject/fill-scenarios is updated.
describe.skip('Revert Validation ExchangeWrapper', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
    let zrxTokenAddress: string;
    let fillScenarios: FillScenarios;
    let exchangeContractAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let coinbase: string;
    let makerAddress: string;
    let anotherMakerAddress: string;
    let takerAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let feeRecipient: string;
    let txHash: string;
    let blockchainLifecycle: BlockchainLifecycle;
    let web3Wrapper: Web3Wrapper;
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
        web3Wrapper = new Web3Wrapper(provider);
        blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
        // Re-deploy the artifacts in this provider, rather than in the default provider exposed in
        // the beforeAll hook. This is due to the fact that the default provider enabled vmErrorsOnRPCResponse
        // and we are explicity testing with vmErrorsOnRPCResponse disabled.
        await blockchainLifecycle.startAsync();
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses: getContractAddresses(),
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.address;
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        zrxTokenAddress = contractWrappers.exchange.zrxTokenAddress;
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            zrxTokenAddress,
            exchangeContractAddress,
            contractWrappers.erc20Proxy.address,
            contractWrappers.erc721Proxy.address,
        );
        [coinbase, makerAddress, takerAddress, feeRecipient, anotherMakerAddress] = userAddresses;
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
            await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            expect(
                contractWrappers.exchange.fillOrderAsync(signedOrder, takerTokenFillAmount, takerAddress, {
                    shouldValidate: true,
                }),
            ).to.be.rejectedWith('TRANSFER_FAILED');
        });
    });
});
