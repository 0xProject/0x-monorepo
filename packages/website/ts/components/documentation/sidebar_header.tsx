import { colors } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { VersionDropDown } from 'ts/components/documentation/version_drop_down';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { ScreenWidths } from 'ts/types';

export interface SidebarHeaderProps {
    screenWidth: ScreenWidths;
    title: string;
    docsVersion?: string;
    availableDocVersions?: string[];
    onVersionSelected?: () => void;
}

export const SidebarHeader: React.StatelessComponent<SidebarHeaderProps> = ({
    screenWidth,
    title,
    docsVersion,
    availableDocVersions,
    onVersionSelected,
}) => {
    return (
        <Container>
            <Container className="flex justify-bottom">
                <Container className="left pl1" width="150px">
                    <Text
                        fontColor={colors.lightLinkBlue}
                        fontSize={screenWidth === ScreenWidths.Sm ? '20px' : '22px'}
                        fontWeight="bold"
                    >
                        {title}
                    </Text>
                </Container>
                {!_.isUndefined(docsVersion) &&
                    !_.isUndefined(availableDocVersions) &&
                    !_.isUndefined(onVersionSelected) && (
                        <div className="right" style={{ alignSelf: 'flex-end' }}>
                            <VersionDropDown
                                selectedVersion={docsVersion}
                                versions={availableDocVersions}
                                onVersionSelected={onVersionSelected}
                            />
                        </div>
                    )}
            </Container>
            <Container
                width={'100%'}
                height={'1px'}
                backgroundColor={colors.grey300}
                marginTop="20px"
                marginBottom="27px"
            />
        </Container>
    );
};
