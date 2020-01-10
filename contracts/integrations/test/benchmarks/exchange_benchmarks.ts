import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { blockchainTests, constants, OrderFactory } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { BigNumber, StringRevertError } from '@0x/utils';

import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { DeploymentManager } from '../framework/deployment_manager';

const START = 465;
const END = 466;

// tslint:disable:no-console
blockchainTests.resets.skip('Exchange Contract Benchmarks', env => {
    let deployment: DeploymentManager;
    let maker: Maker;
    let taker: Taker;
    let makerToken: DummyERC721TokenContract;

    before(async () => {
        const [feeRecipientAddress] = await env.getAccountAddressesAsync();
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 2,
            numErc721TokensToDeploy: 1,
            numErc1155TokensToDeploy: 0,
        });
        const [feeToken, takerToken] = deployment.tokens.erc20;
        [makerToken] = deployment.tokens.erc721;
        const orderConfig = {
            feeRecipientAddress,
            makerAssetAmount: new BigNumber(1),
            takerAssetData: assetDataUtils.encodeERC20AssetData(takerToken.address),
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(feeToken.address),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(feeToken.address),
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
        };
        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig,
        });
        taker = new Taker({ name: 'Taker', deployment });
        await taker.configureERC20TokenAsync(takerToken);
        await taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address);
    });

    it(`MAP EIP721 Benchmark -- max gas used [${START}/${END}]`, async () => {
        console.log(START);
        console.log(END);
        const result = await mapEIP721BinarySearchAsync(START, END);
        console.log(result); // tslint:disable-line:no-console
    });

    interface MapEIP721BenchmarkResult {
        gasUsed: number;
        orderSize: number;
    }

    async function mapEIP721BinarySearchAsync(start: number, end: number): Promise<MapEIP721BenchmarkResult> {
        const orderSize = Math.round((start + end) / 2);
        console.log(`Testsing ${orderSize}`);
        const amounts = Array(orderSize).fill(new BigNumber(1));
        const tokenIds = await maker.configureERC721TokenAsync(makerToken, undefined, orderSize);
        const order = await maker.signOrderAsync({
            makerAssetData: assetDataUtils.encodeMultiAssetData(
                amounts,
                tokenIds.map(id => assetDataUtils.encodeERC721AssetData(makerToken.address, id)),
            ),
        });

        let gasUsed = 0;
        let error;
        try {
            const tx = await taker.fillOrderAsync(order, order.takerAssetAmount, { gasPrice: 1 });
            gasUsed = tx.gasUsed;
        } catch (err) {
            error = err;
        }

        if (error !== undefined) {
            if (orderSize === start) {
                return { gasUsed, orderSize };
            }
            console.log(`Failure, searching [${start}, ${orderSize - 1}]`); // tslint:disable-line:no-console
            return mapEIP721BinarySearchAsync(start, orderSize - 1);
        } else {
            if (orderSize === end) {
                return { gasUsed, orderSize };
            }
            // TODO(jalextowle): This could be optimized by keeping track of a Max success value
            // and performing a check at the end (otherwise the final result can be an off-by-one failure).
            console.log(`Success, searching [${orderSize}, ${end}]`); // tslint:disable-line:no-console
            return mapEIP721BinarySearchAsync(orderSize, end);
        }
    }
});
// tslint:enable:no-console
