import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text } from './ui/text';

export interface MoreInfoSettings {
    text: string;
    href: string;
}

export interface StandardPanelContentProps {
    image: React.ReactNode;
    title: string;
    description: string;
    moreInfoSettings?: MoreInfoSettings;
    action: React.ReactNode;
}

const spacingBetweenPx = '20px';

export const StandardPanelContent: React.StatelessComponent<StandardPanelContentProps> = ({
    image,
    title,
    description,
    moreInfoSettings,
    action,
}) => (
    <Container height="100%">
        <Flex direction="column" height="calc(100% - 55px)">
            <Container marginBottom={spacingBetweenPx}>{image}</Container>
            <Container marginBottom={spacingBetweenPx}>
                <Text fontSize="20px" fontWeight={700} fontColor={ColorOption.black}>
                    {title}
                </Text>
            </Container>
            <Container marginBottom={spacingBetweenPx}>
                <Text fontSize="14px" fontColor={ColorOption.grey} center={true}>
                    {description}
                </Text>
            </Container>
            <Container marginBottom={spacingBetweenPx}>
                {moreInfoSettings && (
                    <a href={moreInfoSettings.href} target="_blank">
                        <Text
                            center={true}
                            fontSize="13px"
                            textDecorationLine="underline"
                            fontColor={ColorOption.lightGrey}
                        >
                            {moreInfoSettings.text}
                        </Text>
                    </a>
                )}
            </Container>
        </Flex>
        <Container>{action}</Container>
    </Container>
);
