import { RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import * as chai from 'chai';
import { BlockParamLiteral } from 'ethereum-types';
import * as _ from 'lodash';
import 'mocha';

import { Web3Wrapper } from '@0x/web3-wrapper';

import { chaiSetup } from './utils/chai_setup';
chaiSetup.configure();

const { expect } = chai;

describe('Web3Integration tests', () => {
    const providerEngine = new Web3ProviderEngine();
    const providerURL = process.env.ETH_RPC_URL_RINKEBY;
    if (providerURL === undefined) {
        return;
    }
    providerEngine.addProvider(new RPCSubprovider(providerURL));
    providerEngine.start();
    const web3Wrapper = new Web3Wrapper(providerEngine);

    // These calls are made to a Oracle Contract deployed on Rinkeby provided in
    // the override example:
    // https://geth.ethereum.org/docs/rpc/ns-eth#override-example
    describe('#eth_call', () => {
        it('works for chekpoint oracle', async () => {
            const expectedReturnData =
                '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004000000000000000000000000d9c9cd5f6779558b6e0ed4e6acf6b1947e7fa1f300000000000000000000000078d1ad571a1a09d60d9bbf25894b44e4c8859595000000000000000000000000286834935f4a8cfb4ff4c77d5770c2775ae2b0e7000000000000000000000000b86e2b0ab5a4b1373e40c51a7c712c70ba2f9f8e';

            const res = await web3Wrapper.callAsync(
                {
                    to: '0xebe8efa441b9302a0d7eaecc277c09d20d684540',
                    data: '0x45848dfc',
                },
                BlockParamLiteral.Latest,
            );

            expect(res).to.be.equal(expectedReturnData);
        });
    });
    describe('#eth_call with override', () => {
        const expectedReturnData = '0x0000000000000000000000000000000000000000000000000000000000000002';
        it('it doesnt works for chekpoint oracle without override', async () => {
            const res = await web3Wrapper.callAsync(
                {
                    to: '0xebe8efa441b9302a0d7eaecc277c09d20d684540',
                    data: '0x0be5b6ba',
                },
                BlockParamLiteral.Latest,
            );

            expect(res).to.not.be.equal(expectedReturnData);
        });
        it('it doesnt works for chekpoint oracle with override', async () => {
            const res = await web3Wrapper.callAsync(
                {
                    to: '0xebe8efa441b9302a0d7eaecc277c09d20d684540',
                    data: '0x0be5b6ba',
                },
                BlockParamLiteral.Latest,
                {
                    '0xebe8efa441b9302a0d7eaecc277c09d20d684540': {
                        code:
                            '0x6080604052348015600f57600080fd5b506004361060285760003560e01c80630be5b6ba14602d575b600080fd5b60336045565b60408051918252519081900360200190f35b6007549056fea265627a7a723058206f26bd0433456354d8d1228d8fe524678a8aeeb0594851395bdbd35efc2a65f164736f6c634300050a0032',
                    },
                },
            );

            expect(res).to.be.equal(expectedReturnData);
        });
    });
});
