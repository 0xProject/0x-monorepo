import { ContractFunctionObj } from '@0x/base-contract';
import { randomAddress } from '@0x/contracts-test-utils';
import { BlockParamLiteral, CallData } from '@0x/dev-utils';
import * as chai from 'chai';
import 'mocha';
import * as TypeMoq from 'typemoq';

import { PLPRegistry, RegistryContract } from '../src/quote_consumers/plp_registry';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;
const ONE_MINUTE_IN_MILLIS = 1000 * 60;

class MockRegistryContracy implements RegistryContract {
    getPoolForMarket(marketA: string, marketB: string): ContractFunctionObj<string> {
        return makeContractReturn('');
    }
}

const makeContractReturn = (result: string): ContractFunctionObj<string> => {
    return {
        getABIEncodedTransactionData: () => '',
        callAsync: async (callData?: Partial<CallData> | undefined, defaultBlock?: number | BlockParamLiteral | undefined): Promise<string> => {
            return result;
        },
    };
};

describe('PLPRegistry', () => {
    const tokenA = randomAddress();
    const tokenB = randomAddress();
    const tokenC = randomAddress();
    const pool1 = randomAddress();
    const pool2 = randomAddress();
    const pool3 = randomAddress();

    let mockRegistry: TypeMoq.IMock<RegistryContract>;
    beforeEach(() => {
        mockRegistry = TypeMoq.Mock.ofType<RegistryContract>(MockRegistryContracy, TypeMoq.MockBehavior.Strict);
    });

    it('should correctly return and cache pool addresses', async () => {
        mockRegistry.setup(
            registry => registry.getPoolForMarket(TypeMoq.It.isValue(tokenB), TypeMoq.It.isValue(tokenC)),
        ).returns(() => makeContractReturn(pool2)).verifiable(TypeMoq.Times.once());
        const registry = new PLPRegistry(mockRegistry.object);

        const firstRequest = await registry.getPoolForMarketAsync(tokenB, tokenC);
        expect(firstRequest).to.eql(pool2);

        const secondRequest = await registry.getPoolForMarketAsync(tokenB, tokenC);
        expect(secondRequest).to.eql(pool2);

        const thirdRequest = await registry.getPoolForMarketAsync(tokenC, tokenB);
        expect(thirdRequest).to.eql(pool2);

        mockRegistry.verifyAll();
    });

    it('should expire cache after 1 hour', async () => {
        mockRegistry.setup(
            registry => registry.getPoolForMarket(TypeMoq.It.isValue(tokenB), TypeMoq.It.isValue(tokenC)),
        ).returns(() => makeContractReturn(pool2));
        mockRegistry.setup(
            registry => registry.getPoolForMarket(TypeMoq.It.isValue(tokenB), TypeMoq.It.isValue(tokenC)),
        ).returns(() => makeContractReturn(pool1));
        mockRegistry.setup(
            registry => registry.getPoolForMarket(TypeMoq.It.isValue(tokenB), TypeMoq.It.isValue(tokenC)),
        ).returns(() => makeContractReturn(pool3));

        const registry = new PLPRegistry(mockRegistry.object);

        const firstRequest = await registry.getPoolForMarketAsync(tokenB, tokenC);
        expect(firstRequest).to.eql(pool2);

        const tenMinutesFromNow = new Date().getTime() + ONE_MINUTE_IN_MILLIS * 10;
        const secondRequest = await registry.getPoolForMarketAsync(tokenB, tokenC, tenMinutesFromNow);
        expect(secondRequest).to.eql(pool2);

        const twoHoursFromNow = new Date().getTime() + ONE_MINUTE_IN_MILLIS * 120;
        const thirdRequest = await registry.getPoolForMarketAsync(tokenB, tokenC, twoHoursFromNow);
        expect(thirdRequest).to.eql(pool1);

        const twoHoursTenMinutesFromNow = new Date().getTime() + ONE_MINUTE_IN_MILLIS * 130;
        const fourthRequest = await registry.getPoolForMarketAsync(tokenB, tokenC, twoHoursTenMinutesFromNow);
        expect(fourthRequest).to.eql(pool1);
    });

    it('should also cache when the pool does not exist', async () => {
        mockRegistry.setup(
            registry => registry.getPoolForMarket(TypeMoq.It.isValue(tokenB), TypeMoq.It.isValue(tokenC)),
        ).throws(new Error('Market pair is not set')).verifiable(TypeMoq.Times.once());

        const registry = new PLPRegistry(mockRegistry.object);
        const firstRequest = await registry.getPoolForMarketAsync(tokenB, tokenC);
        expect(firstRequest).to.be.undefined();

        const secondRequest = await registry.getPoolForMarketAsync(tokenB, tokenC);
        expect(secondRequest).to.be.undefined();

        mockRegistry.verifyAll();
    });

    it('should not cache miscellaneous errors', async () => {
        mockRegistry.setup(
            registry => registry.getPoolForMarket(TypeMoq.It.isValue(tokenB), TypeMoq.It.isValue(tokenC)),
        ).throws(new Error('Error connecting to Web3 RPC service')).verifiable(TypeMoq.Times.once());

        const registry = new PLPRegistry(mockRegistry.object);
        expect(registry.getPoolForMarketAsync(tokenB, tokenC)).to.eventually.to.be.rejectedWith('Error connecting to Web3 RPC service');
        mockRegistry.verifyAll();
    });
});
