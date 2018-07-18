import * as bodyParser from 'body-parser';
import * as express from 'express';

import { constants } from './constants';
import { errorReporter } from './error_reporter';
import { Handler } from './handler';
import { parameterTransformer } from './parameter_transformer';

// Setup the errorReporter to catch uncaught exceptions and unhandled rejections
errorReporter.setup();

const app = express();
app.use(bodyParser.json()); // for parsing application/json
// tslint:disable-next-line:no-unused-variable
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const handler = new Handler();
// tslint:disable-next-line:no-unused-variable
app.get('/ping', (req: express.Request, res: express.Response) => {
    res.status(constants.SUCCESS_STATUS).send('pong');
});
app.get('/info', handler.getQueueInfo.bind(handler));
app.get(
    '/ether/:recipient',
    parameterTransformer.transform.bind(parameterTransformer),
    handler.dispenseEther.bind(handler),
);
app.get(
    '/zrx/:recipient',
    parameterTransformer.transform.bind(parameterTransformer),
    handler.dispenseZRX.bind(handler),
);
app.get(
    '/order/weth/:recipient',
    parameterTransformer.transform.bind(parameterTransformer),
    handler.dispenseWETHOrderAsync.bind(handler),
);
app.get(
    '/order/zrx/:recipient',
    parameterTransformer.transform.bind(parameterTransformer),
    handler.dispenseZRXOrderAsync.bind(handler),
);

// Log to rollbar any errors unhandled by handlers
app.use(errorReporter.errorHandler());
const DEFAULT_PORT = 3000;
const port = process.env.PORT || DEFAULT_PORT;
app.listen(port);
