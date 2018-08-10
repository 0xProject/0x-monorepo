import { writeFileSync } from 'fs';

import { api } from '../src';

const apiJson = JSON.stringify(api);
writeFileSync('lib/api.json', apiJson);
