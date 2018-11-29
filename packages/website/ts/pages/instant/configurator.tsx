import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { CodeDemo } from 'ts/pages/instant/code_demo';
import { colors } from 'ts/style/colors';

export interface ConfiguratorProps {
    hash: string;
}

export const Configurator = (props: ConfiguratorProps) => (
    <Container className="flex" id={props.hash} height="400px" backgroundColor={colors.instantTertiaryBackground}>
        <Container> Forms </Container>
        <CodeDemo />
    </Container>
);
