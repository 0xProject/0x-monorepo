import * as React from 'react';
import { render } from 'react-dom';
import { Router, Link } from '@reach/router';

import Trace from 'ts/pages/Trace';
import Compiler from 'ts/pages/Compiler';
import Cov from 'ts/pages/Cov';
import Profiler from 'ts/pages/Profiler';

const Index = (props: any) => (
    <ul>
        <li>
            <Link to="/trace">sol-trace</Link>
        </li>
        <li>
            <Link to="/compiler">sol-compiler</Link>
        </li>
        <li>
            <Link to="/cov">sol-cov</Link>
        </li>
        <li>
            <Link to="/profiler">sol-profiler</Link>
        </li>
    </ul>
);

const App = () => (
    <Router>
        <Trace path="/trace" />
        <Compiler path="/compiler" />
        <Cov path="/cov" />
        <Profiler path="/profiler" />
        <Index default />
    </Router>
);

render(<App />, document.getElementById('app'));
