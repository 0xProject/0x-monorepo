import { chaiSetup } from '@0x/dev-utils';
export { chaiSetup } from '@0x/dev-utils';
import * as chai from 'chai';

// Set up chai.
chaiSetup.configure();
export const expect = chai.expect;
