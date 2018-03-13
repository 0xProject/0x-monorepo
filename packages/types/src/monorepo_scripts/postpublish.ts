import { postpublishUtils } from '@0xproject/monorepo-scripts';

import * as packageJSON from '../package.json';

const subPackageName = (packageJSON as any).name;
// tslint:disable-next-line:no-floating-promises
postpublishUtils.standardPostPublishAsync(subPackageName);
