import * as _ from 'lodash';
import * as React from 'react';

export interface HomeProps {
    location: Location;
}

interface HomeState {}

export class Home extends React.Component<HomeProps, HomeState> {
    public render() {
        return (
            <div className="mx-auto max-width-4 center">
                <h1>React TS Starter Project</h1>
            </div>
        );
    }
}
