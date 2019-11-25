import { artifacts } from '@0x/contracts-erc20-bridge-sampler';
import { hexSlice, randomAddress } from '@0x/contracts-test-utils';
import { OrderInfo, OrderWithoutDomain } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { JSONRPCErrorCallback, JSONRPCRequestPayload, MethodAbi, Provider } from 'ethereum-types';
import * as _ from 'lodash';

const SELECTOR_SIZE = 4;

export interface SamplerCallResult {
    orderInfos: OrderInfo[];
    samples: BigNumber[][];
}

export enum SamplerFunction {
    QueryOrdersAndSampleBuys = 'queryOrdersAndSampleBuys',
    QueryOrdersAndSampleSells = 'queryOrdersAndSampleSells',
}

export interface SamplerCallParams {
    fn: SamplerFunction;
    orders: OrderWithoutDomain[];
    sources: string[];
    fillAmounts: BigNumber[];
}
export type SamplerCallHandler = (params: SamplerCallParams) => SamplerCallResult;

const SAMPLER_ABI = artifacts.IERC20BridgeSampler.compilerOutput.abi;
const QUERY_AND_SAMPLE_SELL_ABI_FN = _.find(
    SAMPLER_ABI,
    fn => fn.type === 'function' && (fn as any).name === SamplerFunction.QueryOrdersAndSampleSells,
) as MethodAbi;
const QUERY_AND_SAMPLE_BUY_ABI_FN = _.find(
    SAMPLER_ABI,
    fn => fn.type === 'function' && (fn as any).name === SamplerFunction.QueryOrdersAndSampleBuys,
) as MethodAbi;
const QUERY_AND_SAMPLE_SELL_SELECTOR = AbiEncoder.createMethod(
    QUERY_AND_SAMPLE_SELL_ABI_FN.name,
    QUERY_AND_SAMPLE_SELL_ABI_FN.inputs,
).getSelector();
const QUERY_AND_SAMPLE_BUY_SELECTOR = AbiEncoder.createMethod(
    QUERY_AND_SAMPLE_BUY_ABI_FN.name,
    QUERY_AND_SAMPLE_BUY_ABI_FN.inputs,
).getSelector();

/**
 * Mock provider for testing queries to the sampler contract, without actually
 * spinning up a blockchain.
 */
export class SamplerProvider implements Provider {
    public readonly SENDER_ADDRESS = randomAddress();
    public readonly handler: SamplerCallHandler;

    public constructor(handler: SamplerCallHandler) {
        this.handler = handler;
    }

    public sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback): void {
        const result = {
            jsonrpc: payload.jsonrpc,
            id: payload.id,
            result: '0x' as any,
        };
        switch (payload.method) {
            case 'eth_call':
                result.result = encodeSamplerEthCallResult(
                    this.handler(decodeSamplerEthCallData((payload.params as any)[0].data)),
                );
                break;
            case 'net_version':
                result.result = '1';
                break;
            case 'eth_estimateGas':
                result.result = '0x5208'; // 21000 in hex
                break;
            case 'eth_accounts':
                result.result = [this.SENDER_ADDRESS];
                break;
            default:
                throw new Error(`Unhandled provider method: ${payload.method}`);
        }
        callback(null, result);
    }
}

function decodeSamplerEthCallData(callData: string): SamplerCallParams {
    const encoder = AbiEncoder.create(QUERY_AND_SAMPLE_SELL_ABI_FN.inputs);
    const selector = hexSlice(callData, 0, SELECTOR_SIZE);
    const [orders, sources, fillAmounts] = encoder.decodeAsArray(hexSlice(callData, SELECTOR_SIZE));
    return {
        fn: selectorToFunction(selector),
        orders,
        sources,
        fillAmounts,
    };
}

function encodeSamplerEthCallResult(result: SamplerCallResult): string {
    const encoder = AbiEncoder.create(QUERY_AND_SAMPLE_SELL_ABI_FN.outputs);
    return encoder.encode([result.orderInfos, result.samples]);
}

function selectorToFunction(selector: string): SamplerFunction {
    if (selector === QUERY_AND_SAMPLE_SELL_SELECTOR) {
        return SamplerFunction.QueryOrdersAndSampleSells;
    }
    if (selector === QUERY_AND_SAMPLE_BUY_SELECTOR) {
        return SamplerFunction.QueryOrdersAndSampleBuys;
    }
    throw new Error(`Unknown selector: ${selector}`);
}
