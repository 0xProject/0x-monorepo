import * as React from 'react';
import { render } from 'react-dom';

import { Nav } from './components/nav';
import { RequestForm } from './components/request_form';
import { RequestResults } from './components/request_results';

export class App extends React.PureComponent<{}, {}> {
    onSubmit(requestInfo: {
        sellToken: string;
        buyToken: string;
        sellAmount: number;
        rfqtUrl: string;
        apiKey: string;
    }) {
        console.log('submitting', requestInfo);
    }
    render() {
        return (
            <div style={{ fontFamily: 'Courier New' }}>
                <Nav />

                <div style={{ marginTop: '20px', marginLeft: '20px' }}>
                    <RequestForm onSubmit={this.onSubmit} />
                    <div style={{ float: 'left', minWidth: '750px' }}>
                        <RequestResults />
                    </div>
                </div>
            </div>
        );
    }
}

render(<App />, document.getElementById('root'));
