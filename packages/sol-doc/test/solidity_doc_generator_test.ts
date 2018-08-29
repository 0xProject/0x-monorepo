import * as _ from 'lodash';

import * as chai from 'chai';
import 'mocha';

import { DocSection } from '@0xproject/types';

import { generateSolDocAsync } from '../src/solidity_doc_generator';

import { chaiSetup } from './util/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('#SolidityDocGenerator', () => {
    it('should generate a doc object that matches the TokenTransferProxy fixture', async () => {
        const doc = await generateSolDocAsync(['TokenTransferProxy'], `${__dirname}/../../test/fixtures/contracts`);

        expect(doc).to.not.be.undefined();

        const tokenTransferProxyConstructorCount = 0;
        const tokenTransferProxyMethodCount = 8;
        const tokenTransferProxyEventCount = 3;
        expect(doc.TokenTransferProxy.constructors.length).to.equal(tokenTransferProxyConstructorCount);
        expect(doc.TokenTransferProxy.methods.length).to.equal(tokenTransferProxyMethodCount);
        if (_.isUndefined(doc.TokenTransferProxy.events)) {
            throw new Error('events should never be undefined');
        }
        expect(doc.TokenTransferProxy.events.length).to.equal(tokenTransferProxyEventCount);

        const ownableConstructorCount = 1;
        const ownableMethodCount = 2;
        const ownableEventCount = 1;
        expect(doc.Ownable.constructors.length).to.equal(ownableConstructorCount);
        expect(doc.Ownable.methods.length).to.equal(ownableMethodCount);
        if (_.isUndefined(doc.Ownable.events)) {
            throw new Error('events should never be undefined');
        }
        expect(doc.Ownable.events.length).to.equal(ownableEventCount);

        const erc20ConstructorCount = 0;
        const erc20MethodCount = 6;
        const erc20EventCount = 2;
        expect(doc.ERC20.constructors.length).to.equal(erc20ConstructorCount);
        expect(doc.ERC20.methods.length).to.equal(erc20MethodCount);
        if (_.isUndefined(doc.ERC20.events)) {
            throw new Error('events should never be undefined');
        }
        expect(doc.ERC20.events.length).to.equal(erc20EventCount);

        const erc20BasicConstructorCount = 0;
        const erc20BasicMethodCount = 3;
        const erc20BasicEventCount = 1;
        expect(doc.ERC20Basic.constructors.length).to.equal(erc20BasicConstructorCount);
        expect(doc.ERC20Basic.methods.length).to.equal(erc20BasicMethodCount);
        if (_.isUndefined(doc.ERC20Basic.events)) {
            throw new Error('events should never be undefined');
        }
        expect(doc.ERC20Basic.events.length).to.equal(erc20BasicEventCount);
    });
});
