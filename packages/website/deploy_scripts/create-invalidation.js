CLOUDFRONT_DISTRIBUTION_ID = 'E6P0PSPWDQP9';

const AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({profile: '0xproject'});
AWS.config.credentials = credentials;

const cloudfront = new AWS.CloudFront();

const createUri = (uri, shouldPrerender, host) => "/" + toBase64(JSON.stringify({ uri, shouldPrerender, host }));

function createCloudfrontInvalidation(items = []) {
    return cloudfront
        .createInvalidation({
        DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
            Paths: { Quantity: items.length, Items: items },
            CallerReference: new Date().toISOString()
        }
        })
        .promise()
        .then(console.log);
}

function invalidatePaths(paths) {
    const cloudFrontUrls = paths.map(path => createUri(path, true));

    return createCloudfrontInvalidation(cloudFrontUrls);
}

function invalidateEverything() {
    return createCloudfrontInvalidation(["/*"]);
}

invalidateEverything();
