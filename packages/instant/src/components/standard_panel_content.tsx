import * as React from 'react';

import { ColorOption } from '../style/theme';
import { util } from '../util/util';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text } from './ui/text';

export interface MoreInfoSettings {
    text: string;
    href: string;
    onClick?: () => void;
}

export interface StandardPanelContentProps {
    image: React.ReactNode;
    title?: string;
    description: string;
    moreInfoSettings?: MoreInfoSettings;
    action: React.ReactNode;
}

const SPACING_BETWEEN_PX = '20px';

const onMoreInfoClick = (href: string, onClick?: () => void) => {
    return () => {
        if (onClick) {
            onClick();
        }
        util.createOpenUrlInNewWindow(href)();
    };
};

export const StandardPanelContent: React.StatelessComponent<StandardPanelContentProps> = ({
    image,
    title,
    description,
    moreInfoSettings,
    action,
}) => (
    <Container height="100%">
        <Flex direction="column" height="calc(100% - 58px)">
            <Container marginBottom={SPACING_BETWEEN_PX}>{image}</Container>
            {title && (
                <Container marginBottom={SPACING_BETWEEN_PX}>
                    <Text fontSize="20px" fontWeight={700} fontColor={ColorOption.black}>
                        {title}
                    </Text>
                </Container>
            )}
            <Container marginBottom={SPACING_BETWEEN_PX}>
                <Text fontSize="14px" fontColor={ColorOption.grey} center={true}>
                    {description}
                </Text>
            </Container>
            <Container marginBottom={SPACING_BETWEEN_PX}>
                {moreInfoSettings && (
                    <Text
                        center={true}
                        fontSize="13px"
                        textDecorationLine="underline"
                        fontColor={ColorOption.lightGrey}
                        onClick={onMoreInfoClick(moreInfoSettings.href, moreInfoSettings.onClick)}
                    >
                        {moreInfoSettings.text}
                    </Text>
                )}
            </Container>
        </Flex>
        <Container>{action}</Container>
    </Container>
);

StandardPanelContent.displayName = 'StandardPanelContent';
