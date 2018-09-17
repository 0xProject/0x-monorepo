import * as _ from 'lodash';

import * as chai from 'chai';
import 'mocha';

import { DocAgnosticFormat, SolidityMethod } from '@0xproject/types';

import { generateSolDocAsync } from '../src/solidity_doc_generator';

import { chaiSetup } from './util/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('#SolidityDocGenerator', async () => {
    const docPromises: Array<Promise<DocAgnosticFormat>> = [
        generateSolDocAsync(`${__dirname}/../../test/fixtures/contracts`),
        generateSolDocAsync(`${__dirname}/../../test/fixtures/contracts`, []),
        generateSolDocAsync(`${__dirname}/../../test/fixtures/contracts`, ['TokenTransferProxy']),
    ];
    docPromises.forEach(docPromise => {
        it('should generate a doc object that matches the TokenTransferProxy fixture', async () => {
            const doc = await docPromise;
            expect(doc).to.not.be.undefined();

            expect(doc.TokenTransferProxy).to.not.be.undefined();
            expect(doc.TokenTransferProxy.constructors).to.not.be.undefined();
            const tokenTransferProxyConstructorCount = 0;
            const tokenTransferProxyMethodCount = 8;
            const tokenTransferProxyEventCount = 3;
            expect(doc.TokenTransferProxy.constructors.length).to.equal(tokenTransferProxyConstructorCount);
            expect(doc.TokenTransferProxy.methods.length).to.equal(tokenTransferProxyMethodCount);
            if (_.isUndefined(doc.TokenTransferProxy.events)) {
                throw new Error('events should never be undefined');
            }
            expect(doc.TokenTransferProxy.events.length).to.equal(tokenTransferProxyEventCount);

            expect(doc.Ownable).to.not.be.undefined();
            expect(doc.Ownable.constructors).to.not.be.undefined();
            expect(doc.Ownable.methods).to.not.be.undefined();
            const ownableConstructorCount = 1;
            const ownableMethodCount = 2;
            const ownableEventCount = 1;
            expect(doc.Ownable.constructors.length).to.equal(ownableConstructorCount);
            expect(doc.Ownable.methods.length).to.equal(ownableMethodCount);
            if (_.isUndefined(doc.Ownable.events)) {
                throw new Error('events should never be undefined');
            }
            expect(doc.Ownable.events.length).to.equal(ownableEventCount);

            expect(doc.ERC20).to.not.be.undefined();
            expect(doc.ERC20.constructors).to.not.be.undefined();
            expect(doc.ERC20.methods).to.not.be.undefined();
            const erc20ConstructorCount = 0;
            const erc20MethodCount = 6;
            const erc20EventCount = 2;
            expect(doc.ERC20.constructors.length).to.equal(erc20ConstructorCount);
            expect(doc.ERC20.methods.length).to.equal(erc20MethodCount);
            if (_.isUndefined(doc.ERC20.events)) {
                throw new Error('events should never be undefined');
            }
            expect(doc.ERC20.events.length).to.equal(erc20EventCount);

            expect(doc.ERC20Basic).to.not.be.undefined();
            expect(doc.ERC20Basic.constructors).to.not.be.undefined();
            expect(doc.ERC20Basic.methods).to.not.be.undefined();
            const erc20BasicConstructorCount = 0;
            const erc20BasicMethodCount = 3;
            const erc20BasicEventCount = 1;
            expect(doc.ERC20Basic.constructors.length).to.equal(erc20BasicConstructorCount);
            expect(doc.ERC20Basic.methods.length).to.equal(erc20BasicMethodCount);
            if (_.isUndefined(doc.ERC20Basic.events)) {
                throw new Error('events should never be undefined');
            }
            expect(doc.ERC20Basic.events.length).to.equal(erc20BasicEventCount);

            let addAuthorizedAddressMethod: SolidityMethod | undefined;
            for (const method of doc.TokenTransferProxy.methods) {
                if (method.name === 'addAuthorizedAddress') {
                    addAuthorizedAddressMethod = method;
                }
            }
            expect(
                addAuthorizedAddressMethod,
                `method addAuthorizedAddress not found in ${JSON.stringify(doc.TokenTransferProxy.methods)}`,
            ).to.not.be.undefined();
            const tokenTransferProxyAddAuthorizedAddressComment = 'Authorizes an address.';
            expect((addAuthorizedAddressMethod as SolidityMethod).comment).to.equal(
                tokenTransferProxyAddAuthorizedAddressComment,
            );
        });
    });
});
