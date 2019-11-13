import * as chai from 'chai';

import { chaiSetup } from '../chai_setup';
import { fixtureData } from '../utils/fixture_data';

import { DebugPayload, DebugSubprovider } from './../../src/subproviders/debug_subprovider';

chaiSetup.configure();
const expect = chai.expect;

const blankCallback = () => {
    return;
};

describe('DebugSubprovider', () => {
    describe('sends debug message to callback', async () => {
        let sentDebugData: DebugPayload | undefined;
        const debugCallback = (curDebugData: DebugPayload) => {
            sentDebugData = curDebugData;
            return;
        };
        before(() => {
            sentDebugData = undefined;
        });
        it('for ERC20 transfer', async () => {
            const fixtureRpcPayload = fixtureData.ERC20_TRANSFER_RPC_PAYLOAD;
            const debugSubprovider = new DebugSubprovider(debugCallback);
            await debugSubprovider.handleRequest(fixtureRpcPayload, blankCallback, blankCallback);

            if (!sentDebugData) {
                fail('No debug data sent');
            } else {
                expect(sentDebugData.id).to.eql(fixtureRpcPayload.id);
                expect(sentDebugData.jsonrpc).to.eql(fixtureRpcPayload.jsonrpc);
                expect(sentDebugData.params).to.eql(fixtureRpcPayload.params);
                expect(sentDebugData.method).to.eql(fixtureRpcPayload.method);

                const rawTxnAttrs = sentDebugData.rawTransactionAttributes;
                if (!rawTxnAttrs) {
                    fail('No rawTransactionAttributes');
                } else {
                    expect(rawTxnAttrs.gasLimit).to.eql('37428');
                    expect(rawTxnAttrs.gasPrice).to.eql('1000000000');
                    expect(rawTxnAttrs.nonce).to.eql('32');
                    expect(rawTxnAttrs.value).to.eql('0');
                    expect(rawTxnAttrs.to).to.eql('0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa');
                }
            }
        });
        it('for eth_blockNumber command', async () => {
            const fixtureRpcPayload = fixtureData.ETH_GETBLOCK_RPC_PAYLOAD;
            const debugSubprovider = new DebugSubprovider(debugCallback);
            await debugSubprovider.handleRequest(fixtureRpcPayload, blankCallback, blankCallback);

            if (!sentDebugData) {
                fail('No debug data sent');
            } else {
                expect(sentDebugData).to.eql(fixtureRpcPayload);
            }
        });
        it('for regular ETH transfer', async () => {
            const fixtureRpcPayload = fixtureData.ETH_TRANSFER_PAYLOAD;
            const debugSubprovider = new DebugSubprovider(debugCallback);
            await debugSubprovider.handleRequest(fixtureRpcPayload, blankCallback, blankCallback);

            if (!sentDebugData) {
                fail('No debug data sent');
            } else {
                expect(sentDebugData.id).to.eql(fixtureRpcPayload.id);
                expect(sentDebugData.jsonrpc).to.eql(fixtureRpcPayload.jsonrpc);
                expect(sentDebugData.params).to.eql(fixtureRpcPayload.params);
                expect(sentDebugData.method).to.eql(fixtureRpcPayload.method);

                const rawTxnAttrs = sentDebugData.rawTransactionAttributes;
                if (!rawTxnAttrs) {
                    fail('No rawTransactionAttributes');
                } else {
                    expect(rawTxnAttrs.gasLimit).to.eql('21000');
                    expect(rawTxnAttrs.gasPrice).to.eql('8000000000');
                    expect(rawTxnAttrs.nonce).to.eql('38');
                    expect(rawTxnAttrs.value).to.eql('410000000000000');
                    expect(rawTxnAttrs.to).to.eql('0x8a333a18b924554d6e83ef9e9944de6260f61d3b');
                }
            }
        });
    });
});
