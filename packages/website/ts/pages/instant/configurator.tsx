import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { colors } from 'ts/style/colors';

export interface ConfiguratorProps {
    hash: string;
}

export const Configurator = (props: ConfiguratorProps) => (
    <Container id={props.hash} height="400px" backgroundColor={colors.instantTertiaryBackground} />
);
