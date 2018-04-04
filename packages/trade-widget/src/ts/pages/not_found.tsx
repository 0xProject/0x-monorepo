import * as _ from 'lodash';
import * as React from 'react';

import { Styles } from '../types';

export interface NotFoundProps {
    location: Location;
}

interface NotFoundState {}

const styles: Styles = {
    thin: {
        fontWeight: 100,
    },
};

export class NotFound extends React.Component<NotFoundProps, NotFoundState> {
    public render() {
        return (
            <div>
                <div className="mx-auto max-width-4 py4">
                    <div className="center py4">
                        <div className="py4">
                            <div className="py4">
                                <h1 style={{ ...styles.thin }}>404 Not Found</h1>
                                <div className="py1">
                                    <div className="py3">
                                        Hm... looks like we couldn't find what you are looking for.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
