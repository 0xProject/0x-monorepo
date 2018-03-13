import { postpublishUtils } from '../postpublish_utils';

import * as packageJSON from '../package.json';

const subPackageName = (packageJSON as any).name;
postpublishUtils.standardPostPublishAsync(subPackageName);
