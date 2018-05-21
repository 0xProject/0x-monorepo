import 'make-promises-safe';
import 'mocha';
import * as nock from 'nock';

import * as defaultRequestTokenPairsResponseJSON from './fixtures/v0/token_pairs/default_request.json';
import * as malformedTokenPairsResponseJSON from './fixtures/v0/token_pairs/malformed.json';
import * as tokenAAndTokenBParamsTokenPairsResponseJSON from './fixtures/v0/token_pairs/token_a_and_token_b_params.json';
import * as tokenAParamTokenPairsResponseJSON from './fixtures/v0/token_pairs/token_a_param.json';
import * as tokenBParamTokenPairsResponseJSON from './fixtures/v0/token_pairs/token_b_param.json';
import { testRunner } from './test_runner';

describe('Postman Collection v0', () => {
    const testRelayerUrl = 'https://example.com';
    const nockScope = nock(testRelayerUrl);
    afterEach(() => {
        nock.cleanAll();
    });
    describe('GET /token_pairs', () => {
        const postmanCollectionFolderName = 'GET /token_pairs';
        const resourcePath = '/token_pairs';
        describe('default request', () => {
            const postmanCollectionRequestName = 'default request';
            const nockInterceptor = nockScope.get(resourcePath);
            testRunner.runContentTypeTests(nockInterceptor, postmanCollectionFolderName, postmanCollectionRequestName);
            testRunner.runSchemaTests(
                nockInterceptor,
                postmanCollectionFolderName,
                postmanCollectionRequestName,
                malformedTokenPairsResponseJSON,
                defaultRequestTokenPairsResponseJSON,
            );
        });
        describe('tokenA param', () => {
            const postmanCollectionRequestName = 'tokenA param';
            const nockInterceptor = nockScope.get(resourcePath).query({
                tokenA: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            });
            testRunner.runContentTypeTests(nockInterceptor, postmanCollectionFolderName, postmanCollectionRequestName);
            testRunner.runSchemaTests(
                nockInterceptor,
                postmanCollectionFolderName,
                postmanCollectionRequestName,
                malformedTokenPairsResponseJSON,
                tokenAParamTokenPairsResponseJSON,
            );
        });
        describe('tokenB param', () => {
            const postmanCollectionRequestName = 'tokenB param';
            const nockInterceptor = nockScope.get(resourcePath).query({
                tokenB: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            });
            testRunner.runContentTypeTests(nockInterceptor, postmanCollectionFolderName, postmanCollectionRequestName);
            testRunner.runSchemaTests(
                nockInterceptor,
                postmanCollectionFolderName,
                postmanCollectionRequestName,
                malformedTokenPairsResponseJSON,
                tokenBParamTokenPairsResponseJSON,
            );
        });
        describe('tokenA and tokenB params', () => {
            const postmanCollectionRequestName = 'tokenA and tokenB params';
            const nockInterceptor = nockScope.get(resourcePath).query({
                tokenA: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                tokenB: '0xe41d2489571d322189246dafa5ebde1f4699f498',
            });
            testRunner.runContentTypeTests(nockInterceptor, postmanCollectionFolderName, postmanCollectionRequestName);
            testRunner.runSchemaTests(
                nockInterceptor,
                postmanCollectionFolderName,
                postmanCollectionRequestName,
                malformedTokenPairsResponseJSON,
                tokenAAndTokenBParamsTokenPairsResponseJSON,
            );
        });
    });
});
