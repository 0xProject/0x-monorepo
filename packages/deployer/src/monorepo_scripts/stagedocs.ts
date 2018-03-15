import { postpublishUtils } from '@0xproject/monorepo-scripts';

import * as packageJSON from '../package.json';
import * as tsConfigJSON from '../tsconfig.json';

const cwd = `${__dirname}/..`;
// tslint:disable-next-line:no-floating-promises
postpublishUtils.publishDocsToStagingAsync(packageJSON, tsConfigJSON, cwd);
