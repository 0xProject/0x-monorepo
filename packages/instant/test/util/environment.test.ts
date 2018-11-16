import { Environment } from '../../src/types';
import { scriptEnvironment } from '../../src/util/script_environment';

describe('environmentUtil', () => {
    describe('urlToEnvironment', () => {
        const urlsToEnvironments: { [url: string]: Environment } = {
            'https://unpkg.com/0x/instant@1.0/main.js': Environment.Production,
            'https://jsdelivr.com/0x/instant@1.0/main.js': Environment.Production,
            'https://0x-instant-staging.s3-website-us-east-1.amazonaws.com?networkId=42&orderSource=provided':
                Environment.Staging,
            'https://0x-instant-staging.s3-website-us-east-1.amazonaws.com': Environment.Staging,
            'https://0x-instant-dogfood.s3-website-us-east-1.amazonaws.com/?networkId=42&orderSource=provided':
                Environment.Dogfood,
            'https://0x-instant-dogfood.s3-website-us-east-1.amazonaws.com/': Environment.Dogfood,
            'http://localhost:8080/somepath.html': Environment.Development,
            'https://b32f23f32f.ngrok.io/something.html': Environment.Development,
            'http://127.0.0.1/': Environment.Development,
        };

        const urlKeys = Object.keys(urlsToEnvironments);
        urlKeys.forEach(key => {
            const expectedEnvironment = urlsToEnvironments[key];
            it(`should map ${key} to ${expectedEnvironment}`, () => {
                expect(scriptEnvironment.urlToEnvironment(key)).toBe(expectedEnvironment);
            });
        });
    });
});
