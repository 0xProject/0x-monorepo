import { configure, shallow } from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
import * as React from 'react';

configure({ adapter: new Adapter() });

import { ZeroExInstant } from '../../src';

describe('<ZeroExInstant />', () => {
    it('shallow renders without crashing', () => {
        shallow(<ZeroExInstant />);
    });
});
