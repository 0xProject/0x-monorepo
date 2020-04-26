import * as React from 'react';
import { render } from 'react-dom';

import { Nav } from './components/nav';
import { RequestForm } from './components/request_form';

const App = () => (
    <div style={{ fontFamily: 'Courier New' }}>
        <Nav />

        <div style={{ marginTop: '20px', marginLeft: '20px' }}>
            <RequestForm />
        </div>
    </div>
);

render(<App />, document.getElementById('root'));
