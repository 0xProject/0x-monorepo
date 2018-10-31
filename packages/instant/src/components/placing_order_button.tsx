import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Button, Container, Spinner, Text } from './ui';

export const PlacingOrderButton: React.StatelessComponent<{}> = props => (
    <Button isDisabled={true} width="100%">
        <Container display="inline-block" position="relative" top="3px" marginRight="8px">
            <Spinner widthPx={20} heightPx={20} />
        </Container>
        <Text fontColor={ColorOption.white} fontWeight={600} fontSize="20px">
            Placing Order&hellip;
        </Text>
    </Button>
);
