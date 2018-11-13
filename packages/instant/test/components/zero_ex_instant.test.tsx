import { configure, shallow } from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
import * as React from 'react';

configure({ adapter: new Adapter() });

// TODO: Write non-trivial tests.
// At time of writing we cannot render ZeroExInstant
// because we are looking for a provider on window.
// But in the future it will be dependency injected.
describe('<Test />', () => {
    it('runs a test', () => {
        shallow(<div />);
    });
});
