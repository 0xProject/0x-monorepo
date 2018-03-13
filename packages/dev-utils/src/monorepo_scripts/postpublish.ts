import { postpublishUtils } from '@0xproject/monorepo-scripts';

import * as packageJSON from '../package.json';

const subPackageName = (packageJSON as any).name;
postpublishUtils.standardPostPublishAsync(subPackageName);
