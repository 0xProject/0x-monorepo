import { RPCSubprovider, Web3ProviderEngine } from "@0x/subproviders"
import { Web3Wrapper } from "@0x/dev-utils";
import { DexOrderSampler } from "./utils/market_operation_utils/sampler";
import { ERC20BridgeSamplerContract } from "../generated-wrappers/erc20_bridge_sampler";
import { getContractAddressesForChainOrThrow, ChainId } from "@0x/contract-addresses";
import { MarketOperationUtils } from "./utils/market_operation_utils";
import { createDummyOrderForSampler } from "./utils/market_operation_utils/orders";
import { assetDataUtils } from "@0x/order-utils";
import { NULL_ADDRESS, BigNumber } from "@0x/utils";
import { SwapQuoter } from "./swap_quoter";
import { orderbookMock } from "../test/utils/mocks";
import { Orderbook } from "@0x/orderbook";
import { notEqual } from "assert";
import delay from "delay";
import * as _ from "lodash";

const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'


async function main() {
    const subprovider = new RPCSubprovider(process.env.RPC_URL!);
    const engine = new Web3ProviderEngine();
    engine.addProvider(subprovider);
    engine.start();

    // Create client
    const client = new Web3Wrapper(engine);
    const chainId = await client.getChainIdAsync();
    console.log(`Chain ID is ${chainId}`);

    // Create sampler
    const addresses = getContractAddressesForChainOrThrow(chainId);
    const sampler = new DexOrderSampler(
        new ERC20BridgeSamplerContract(addresses.erc20BridgeSampler, client.getProvider()),
    );

    const swapQuoter = new SwapQuoter(
        client.getProvider(),
        Orderbook.getOrderbookForProvidedOrders([]),
        {
            chainId,
            contractAddresses: addresses,
            liquidityProviderRegistryAddress: '0xdb95255e2b4aa9997d73af473279c91db844332b',
        }
    );

    let lastBlockProcessed: undefined | number;
    while (true) {
        // Get last block
        const newBlock = await client.getBlockNumberAsync()
        if (lastBlockProcessed !== newBlock) {
            const t1 = new Date().getTime();
            const res = await swapQuoter.getMarketSellSwapQuoteAsync(
                addresses.etherToken,
                DAI_ADDRESS,
                Web3Wrapper.toBaseUnitAmount(1000, 18),
            );
            const mou = swapQuoter.marketOperationUtils;
            let items = [1000];
            for(let i=0; i < 40; i++ ) {
                items.push(items[items.length-1] + 500);
            }
            const someData = await mou.getSampleAmountsAsync(
                items.map(k => Web3Wrapper.toBaseUnitAmount(k, 18)),
                [
                    [addresses.etherToken, DAI_ADDRESS],
                    [DAI_ADDRESS, addresses.etherToken],
                    [addresses.etherToken, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
                    [DAI_ADDRESS, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
                ],
            );
            const t2 = new Date().getTime();
            const delta = t2 - t1;
            console.log(`Complete! took ${delta} ms. Processed new block ${newBlock}. Delta blocks is ${newBlock - (lastBlockProcessed || 0)}`);

            const amountSamples = someData.length;
            const numFills = someData[0].length;
            console.log(`Total ${amountSamples} samples and ${numFills} fills: ${amountSamples * numFills} total quotes`);
            lastBlockProcessed = newBlock;
            await delay(8000);
        } else {
            console.log(`Waiting..`);
            await delay(1000);
        }
    }
    process.exit(0);
}

main()