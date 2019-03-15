import * as chai from 'chai';
import 'mocha';

import { GreenhouseApplication } from '../../../src/entities';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

import { GreenhouseApplicationResponse } from '../../../src/data_sources/greenhouse';
import { parseApplications } from '../../../src/parsers/greenhouse';
import { ParsedApplications } from '../../fixtures/greenhouse/api_v1_applications';
import * as applicationsApiResponse from '../../fixtures/greenhouse/api_v1_applications.json';

describe('Greenhouse parser', () => {
    it('parses API applications responses', () => {
        const actual: GreenhouseApplication[] = (applicationsApiResponse as GreenhouseApplicationResponse[]).map(resp =>
            parseApplications(resp),
        );
        expect(actual).deep.equal(ParsedApplications);
    });
});
