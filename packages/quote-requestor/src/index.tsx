import * as React from 'react';
import { render } from 'react-dom';

import { Nav } from './components/nav';

const App = () => (
    <div>
        <Nav />
    </div>
);

render(<App />, document.getElementById('root'));
