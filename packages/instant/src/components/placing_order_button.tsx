import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Button } from './ui/button';
import { Container } from './ui/container';
import { Spinner } from './ui/spinner';

export const PlacingOrderButton: React.StatelessComponent<{}> = props => (
    <Button isDisabled={true} width="100%" fontColor={ColorOption.white} fontSize="20px">
        <Container display="inline-block" position="relative" top="3px" marginRight="8px">
            <Spinner widthPx={20} heightPx={20} />
        </Container>
        Placing Order&hellip;
    </Button>
);
