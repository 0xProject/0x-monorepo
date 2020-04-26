import * as React from 'react';
import { render } from 'react-dom';

import { Nav } from './components/nav';
import { RequestForm } from './components/request_form';
import { RequestResults } from './components/request_results';

export class App extends React.PureComponent<{}, {}> {
    render() {
        return (
            <div style={{ fontFamily: 'Courier New' }}>
                <Nav />

                <div style={{ marginTop: '20px', marginLeft: '20px' }}>
                    <RequestForm />
                    <div style={{ float: 'left', minWidth: '750px' }}>
                        <RequestResults />
                    </div>
                </div>
            </div>
        );
    }
}

render(<App />, document.getElementById('root'));
