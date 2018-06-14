import * as React from 'react';

import { Text } from 'ts/components/ui/text';
import { ListItem } from 'ts/pages/jobs/list/list_item';
import { colors } from 'ts/style/colors';

export interface HeaderItemProps {
    headerText?: string;
}
export const HeaderItem: React.StatelessComponent<HeaderItemProps> = ({ headerText }) => {
    return (
        <div className="h2 lg-py4 md-py4 sm-py3">
            <ListItem>
                <Text
                    fontFamily="Roboto Mono"
                    fontSize="24px"
                    lineHeight="1.25"
                    minHeight="1.25em"
                    fontColor={colors.black}
                >
                    {headerText}
                </Text>
            </ListItem>
        </div>
    );
};
