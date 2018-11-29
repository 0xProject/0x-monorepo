import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { ActionLink } from 'ts/pages/instant/action_link';
import { CodeDemo } from 'ts/pages/instant/code_demo';
import { colors } from 'ts/style/colors';

export interface ConfiguratorProps {
    hash: string;
}

export const Configurator = (props: ConfiguratorProps) => (
    <Container
        className="flex justify-center py4 px3"
        id={props.hash}
        backgroundColor={colors.instantTertiaryBackground}
    >
        <Container className="mx3">
            <Container className="mb3">
                <Text fontSize="20px" lineHeight="28px" fontColor={colors.white} fontWeight={500}>
                    0x Instant Configurator
                </Text>
            </Container>
            <Container height="400px" width="300px" backgroundColor="white" />
        </Container>
        <Container className="mx3">
            <Container className="mb3 flex justify-between">
                <Text fontSize="20px" lineHeight="28px" fontColor={colors.white} fontWeight={500}>
                    Code Snippet
                </Text>
                <ActionLink displayText="Explore the Docs" linkSrc="/docs/instant" color={colors.grey} />
            </Container>
            <CodeDemo />
        </Container>
    </Container>
);
