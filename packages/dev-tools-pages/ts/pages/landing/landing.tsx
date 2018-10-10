import * as _ from 'lodash';
import * as React from 'react';

interface LandingProps {}

interface LandingState {}

export class Landing extends React.Component<LandingProps, LandingState> {
    constructor(props: LandingProps) {
        super(props);
    }
    public render(): React.ReactNode {
        return <div id="landing" className="clearfix" />;
    }
}
