import { postpublishUtils } from '@0xproject/dev-utils';

import * as packageJSON from '../package.json';

const subPackageName = (packageJSON as any).name;
postpublishUtils.standardPostPublishAsync(subPackageName);
