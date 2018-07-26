import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import { validate } from 'openapi-schema-validation';

import { api } from '../src/index';

chai.config.includeStack = true;
chai.use(dirtyChai);

describe('SRA OpenAPI Schema', () => {
    it('should be a valid OpenAPI schema', () => {
        const result = validate(api, 3);
        chai.expect(result.errors).to.have.length(0);
    });
});
