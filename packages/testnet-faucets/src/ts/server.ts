import * as bodyParser from 'body-parser';
import * as express from 'express';

import { errorReporter } from './error_reporter';
import { Handler } from './handler';

// Setup the errorReporter to catch uncaught exceptions and unhandled rejections
errorReporter.setup();

const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

const handler = new Handler();
app.get('/ping', (req: express.Request, res: express.Response) => {
	res.status(200).send('pong');
});
app.get('/info', handler.getQueueInfo.bind(handler));
app.get('/ether/:recipient', handler.dispenseEther.bind(handler));
app.get('/zrx/:recipient', handler.dispenseZRX.bind(handler));

// Log to rollbar any errors unhandled by handlers
app.use(errorReporter.errorHandler());
const port = process.env.PORT || 3000;
app.listen(port);
