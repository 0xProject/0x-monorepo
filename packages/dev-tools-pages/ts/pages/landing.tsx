import * as _ from 'lodash';
import * as React from 'react';

import { Button } from '../components/ui/button';
import { Container } from '../components/ui/container';

interface LandingProps {}

interface LandingState {}

export class Landing extends React.Component<LandingProps, LandingState> {
    constructor(props: LandingProps) {
        super(props);
    }
    public render(): React.ReactNode {
        return (
            <Container id="landing" className="clearfix">
                <Button>Click me!</Button>
            </Container>
        );
    }
}
