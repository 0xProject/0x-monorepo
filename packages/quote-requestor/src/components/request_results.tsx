import * as React from 'react';
import { AppState } from '..';

export class RequestResults extends React.Component<AppState, {}> {
    renderStatus() {
        if (this.props.requestState == 'loading') {
            return 'Loading...';
        }
        if (this.props.requestState === 'error') {
            return '⚠️ Error';
        }
        return '';
    }

    render() {
        return <div>{this.renderStatus()}</div>;
    }
}
