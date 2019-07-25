import * as _ from 'lodash';
import * as React from 'react';
import { VersionDropDown } from 'ts/components/documentation/version_drop_down';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { ScreenWidths } from 'ts/types';
import { colors } from 'ts/utils/colors';

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
                <Container className="col col-7 pl1">
                    <Text
                        fontColor={colors.lightLinkBlue}
                        fontSize={screenWidth === ScreenWidths.Sm ? '20px' : '22px'}
                        fontWeight="bold"
                        lineHeight="26px"
                    >
                        {title}
                    </Text>
                </Container>
                {docsVersion !== undefined && availableDocVersions !== undefined && onVersionSelected !== undefined && (
                    <div className="col col-5 pl1" style={{ alignSelf: 'flex-end', paddingBottom: 4 }}>
                        <Container className="right">
                            <VersionDropDown
                                selectedVersion={docsVersion}
                                versions={availableDocVersions}
                                onVersionSelected={onVersionSelected}
                            />
                        </Container>
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
