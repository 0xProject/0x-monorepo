import * as _ from 'lodash';

import * as chai from 'chai';
import 'mocha';
//
// import { DocAgnosticFormat, Event, SolidityMethod } from '@0x/types';
//
// import { SolDoc } from '../src/sol_doc';
//
// import { chaiSetup } from './util/chai_setup';
//
// chaiSetup.configure();
// const expect = chai.expect;
// const solDoc = new SolDoc();
//
// describe('#SolidityDocGenerator', () => {
//     it('should generate a doc object that matches the devdoc-free TokenTransferProxy fixture', async () => {
//         const doc = await solDoc.generateSolDocAsync(`${__dirname}/../../test/fixtures/contracts`, [
//             'TokenTransferProxyNoDevdoc',
//         ]);
//         expect(doc).to.not.be.undefined();
//
//         verifyTokenTransferProxyABIIsDocumented(doc, 'TokenTransferProxyNoDevdoc');
//     });
//     const docPromises: Array<Promise<DocAgnosticFormat>> = [
//         solDoc.generateSolDocAsync(`${__dirname}/../../test/fixtures/contracts`),
//         solDoc.generateSolDocAsync(`${__dirname}/../../test/fixtures/contracts`, []),
//     ];
//     docPromises.forEach(docPromise => {
//         it('should generate a doc object that matches the TokenTransferProxy fixture with its dependencies', async () => {
//             const doc = await docPromise;
//             expect(doc).to.not.be.undefined();
//
//             verifyTokenTransferProxyAndDepsABIsAreDocumented(doc, 'TokenTransferProxy');
//
//             let addAuthorizedAddressMethod: SolidityMethod | undefined;
//             for (const method of doc.TokenTransferProxy.methods) {
//                 if (method.name === 'addAuthorizedAddress') {
//                     addAuthorizedAddressMethod = method;
//                 }
//             }
//             const tokenTransferProxyAddAuthorizedAddressComment = 'Authorizes an address.';
//             expect((addAuthorizedAddressMethod as SolidityMethod).comment).to.equal(
//                 tokenTransferProxyAddAuthorizedAddressComment,
//             );
//
//             const expectedParamComment = 'Address to authorize.';
//             expect((addAuthorizedAddressMethod as SolidityMethod).parameters[0].comment).to.equal(expectedParamComment);
//         });
//     });
//     it('should generate a doc object that matches the TokenTransferProxy fixture', async () => {
//         const doc: DocAgnosticFormat = await solDoc.generateSolDocAsync(`${__dirname}/../../test/fixtures/contracts`, [
//             'TokenTransferProxy',
//         ]);
//         verifyTokenTransferProxyABIIsDocumented(doc, 'TokenTransferProxy');
//     });
//     describe('when processing all the permutations of devdoc stuff that we use in our contracts', () => {
//         let doc: DocAgnosticFormat;
//         before(async () => {
//             doc = await solDoc.generateSolDocAsync(`${__dirname}/../../test/fixtures/contracts`, ['NatspecEverything']);
//             expect(doc).to.not.be.undefined();
//             expect(doc.NatspecEverything).to.not.be.undefined();
//         });
//         it('should emit the contract @title as its comment', () => {
//             expect(doc.NatspecEverything.comment).to.equal('Contract Title');
//         });
//         describe('should emit public method documentation for', () => {
//             let methodDoc: SolidityMethod;
//             before(() => {
//                 // tslint:disable-next-line:no-unnecessary-type-assertion
//                 methodDoc = doc.NatspecEverything.methods.find(method => {
//                     return method.name === 'publicMethod';
//                 }) as SolidityMethod;
//                 if (methodDoc === undefined) {
//                     throw new Error('publicMethod not found');
//                 }
//             });
//             it('method name', () => {
//                 expect(methodDoc.name).to.equal('publicMethod');
//             });
//             it('method comment', () => {
//                 expect(methodDoc.comment).to.equal('publicMethod @dev');
//             });
//             it('parameter name', () => {
//                 expect(methodDoc.parameters[0].name).to.equal('p');
//             });
//             it('parameter comment', () => {
//                 expect(methodDoc.parameters[0].comment).to.equal('publicMethod @param');
//             });
//             it('return type', () => {
//                 expect(methodDoc.returnType.name).to.equal('int256');
//             });
//             it('return comment', () => {
//                 expect(methodDoc.returnComment).to.equal('publicMethod @return');
//             });
//         });
//         describe('should emit external method documentation for', () => {
//             let methodDoc: SolidityMethod;
//             before(() => {
//                 // tslint:disable-next-line:no-unnecessary-type-assertion
//                 methodDoc = doc.NatspecEverything.methods.find(method => {
//                     return method.name === 'externalMethod';
//                 }) as SolidityMethod;
//                 if (methodDoc === undefined) {
//                     throw new Error('externalMethod not found');
//                 }
//             });
//             it('method name', () => {
//                 expect(methodDoc.name).to.equal('externalMethod');
//             });
//             it('method comment', () => {
//                 expect(methodDoc.comment).to.equal('externalMethod @dev');
//             });
//             it('parameter name', () => {
//                 expect(methodDoc.parameters[0].name).to.equal('p');
//             });
//             it('parameter comment', () => {
//                 expect(methodDoc.parameters[0].comment).to.equal('externalMethod @param');
//             });
//             it('return type', () => {
//                 expect(methodDoc.returnType.name).to.equal('int256');
//             });
//             it('return comment', () => {
//                 expect(methodDoc.returnComment).to.equal('externalMethod @return');
//             });
//         });
//         it('should not truncate a multi-line devdoc comment', () => {
//             // tslint:disable-next-line:no-unnecessary-type-assertion
//             const methodDoc: SolidityMethod = doc.NatspecEverything.methods.find(method => {
//                 return method.name === 'methodWithLongDevdoc';
//             }) as SolidityMethod;
//             if (methodDoc === undefined) {
//                 throw new Error('methodWithLongDevdoc not found');
//             }
//             expect(methodDoc.comment).to.equal(
//                 'Here is a really long developer documentation comment, which spans multiple lines, for the purposes of making sure that broken lines are consolidated into one devdoc comment.',
//             );
//         });
//         describe('should emit event documentation for', () => {
//             let eventDoc: Event;
//             before(() => {
//                 eventDoc = (doc.NatspecEverything.events as Event[])[0];
//             });
//             it('event name', () => {
//                 expect(eventDoc.name).to.equal('AnEvent');
//             });
//             it('parameter name', () => {
//                 expect(eventDoc.eventArgs[0].name).to.equal('p');
//             });
//         });
//         it('should not let solhint directives obscure natspec content', () => {
//             // tslint:disable-next-line:no-unnecessary-type-assertion
//             const methodDoc: SolidityMethod = doc.NatspecEverything.methods.find(method => {
//                 return method.name === 'methodWithSolhintDirective';
//             }) as SolidityMethod;
//             if (methodDoc === undefined) {
//                 throw new Error('methodWithSolhintDirective not found');
//             }
//             expect(methodDoc.comment).to.equal('methodWithSolhintDirective @dev');
//         });
//     });
//     it('should document a method that returns multiple values', async () => {
//         const doc = await solDoc.generateSolDocAsync(`${__dirname}/../../test/fixtures/contracts`, [
//             'MultipleReturnValues',
//         ]);
//         expect(doc.MultipleReturnValues).to.not.be.undefined();
//         expect(doc.MultipleReturnValues.methods).to.not.be.undefined();
//         let methodWithMultipleReturnValues: SolidityMethod | undefined;
//         for (const method of doc.MultipleReturnValues.methods) {
//             if (method.name === 'methodWithMultipleReturnValues') {
//                 methodWithMultipleReturnValues = method;
//             }
//         }
//         if (methodWithMultipleReturnValues === undefined) {
//             throw new Error('method should not be undefined');
//         }
//         const returnType = methodWithMultipleReturnValues.returnType;
//         expect(returnType.typeDocType).to.equal('tuple');
//         if (returnType.tupleElements === undefined) {
//             throw new Error('returnType.tupleElements should not be undefined');
//         }
//         expect(returnType.tupleElements.length).to.equal(2);
//     });
//     it('should document a method that has a struct param and return value', async () => {
//         const doc = await solDoc.generateSolDocAsync(`${__dirname}/../../test/fixtures/contracts`, [
//             'StructParamAndReturn',
//         ]);
//         expect(doc.StructParamAndReturn).to.not.be.undefined();
//         expect(doc.StructParamAndReturn.methods).to.not.be.undefined();
//         let methodWithStructParamAndReturn: SolidityMethod | undefined;
//         for (const method of doc.StructParamAndReturn.methods) {
//             if (method.name === 'methodWithStructParamAndReturn') {
//                 methodWithStructParamAndReturn = method;
//             }
//         }
//         if (methodWithStructParamAndReturn === undefined) {
//             throw new Error('method should not be undefined');
//         }
//         /**
//          * Solc maps devDoc comments to methods using a method signature. If we incorrectly
//          * generate the methodSignatures, the devDoc comments won't be correctly associated
//          * with their methods and they won't show up in the output. By checking that the comments
//          * are included for a method with structs as params/returns, we are sure that the methodSignature
//          * generation is correct for this case.
//          */
//         expect(methodWithStructParamAndReturn.comment).to.be.equal('DEV_COMMENT');
//         expect(methodWithStructParamAndReturn.returnComment).to.be.equal('RETURN_COMMENT');
//         expect(methodWithStructParamAndReturn.parameters[0].comment).to.be.equal('STUFF_COMMENT');
//     });
//     it('should document the structs included in a contract', async () => {
//         const doc = await solDoc.generateSolDocAsync(`${__dirname}/../../test/fixtures/contracts`, [
//             'StructParamAndReturn',
//         ]);
//         expect(doc.structs).to.not.be.undefined();
//         expect(doc.structs.types.length).to.be.equal(1);
//     });
// });
//
// function verifyTokenTransferProxyABIIsDocumented(doc: DocAgnosticFormat, contractName: string): void {
//     expect(doc[contractName]).to.not.be.undefined();
//     expect(doc[contractName].constructors).to.not.be.undefined();
//     const tokenTransferProxyConstructorCount = 0;
//     const tokenTransferProxyMethodCount = 8;
//     const tokenTransferProxyEventCount = 3;
//     expect(doc[contractName].constructors.length).to.equal(tokenTransferProxyConstructorCount);
//     expect(doc[contractName].methods.length).to.equal(tokenTransferProxyMethodCount);
//     const events = doc[contractName].events;
//     if (events === undefined) {
//         throw new Error('events should never be undefined');
//     }
//     expect(events.length).to.equal(tokenTransferProxyEventCount);
// }
//
// function verifyTokenTransferProxyAndDepsABIsAreDocumented(doc: DocAgnosticFormat, contractName: string): void {
//     verifyTokenTransferProxyABIIsDocumented(doc, contractName);
//
//     expect(doc.ERC20).to.not.be.undefined();
//     expect(doc.ERC20.constructors).to.not.be.undefined();
//     expect(doc.ERC20.methods).to.not.be.undefined();
//     const erc20ConstructorCount = 0;
//     const erc20MethodCount = 6;
//     const erc20EventCount = 2;
//     expect(doc.ERC20.constructors.length).to.equal(erc20ConstructorCount);
//     expect(doc.ERC20.methods.length).to.equal(erc20MethodCount);
//     if (doc.ERC20.events === undefined) {
//         throw new Error('events should never be undefined');
//     }
//     expect(doc.ERC20.events.length).to.equal(erc20EventCount);
//
//     expect(doc.ERC20Basic).to.not.be.undefined();
//     expect(doc.ERC20Basic.constructors).to.not.be.undefined();
//     expect(doc.ERC20Basic.methods).to.not.be.undefined();
//     const erc20BasicConstructorCount = 0;
//     const erc20BasicMethodCount = 3;
//     const erc20BasicEventCount = 1;
//     expect(doc.ERC20Basic.constructors.length).to.equal(erc20BasicConstructorCount);
//     expect(doc.ERC20Basic.methods.length).to.equal(erc20BasicMethodCount);
//     if (doc.ERC20Basic.events === undefined) {
//         throw new Error('events should never be undefined');
//     }
//     expect(doc.ERC20Basic.events.length).to.equal(erc20BasicEventCount);
//
//     let addAuthorizedAddressMethod: SolidityMethod | undefined;
//     for (const method of doc[contractName].methods) {
//         if (method.name === 'addAuthorizedAddress') {
//             addAuthorizedAddressMethod = method;
//         }
//     }
//     expect(
//         addAuthorizedAddressMethod,
//         `method addAuthorizedAddress not found in ${JSON.stringify(doc[contractName].methods)}`,
//     ).to.not.be.undefined();
// }
