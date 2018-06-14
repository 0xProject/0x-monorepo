import * as _ from 'lodash';
import * as React from 'react';

import { Text } from 'ts/components/ui/text';
import { HeaderItem } from 'ts/pages/jobs/list/header_item';
import { ListItem } from 'ts/pages/jobs/list/list_item';
import { colors } from 'ts/style/colors';

const VALUE_ITEM_PROPS_LIST: ValueItemProps[] = [
    {
        bulletColor: '#6FCF97',
        title: 'Ethics/Doing the right thing',
        description: 'orem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
    {
        bulletColor: '#56CCF2',
        title: 'Consistently ship',
        description: 'orem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
    {
        bulletColor: '#EB5757',
        title: 'Focus on long term impact',
        description: 'orem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
];

const HEADER_TEXT = 'Our Values';
const VALUE_ITEM_MIN_HEIGHT = 150;

export const Values = () => {
    return (
        <div className="mx-auto max-width-4">
            <HeaderItem headerText={HEADER_TEXT} />
            {_.map(VALUE_ITEM_PROPS_LIST, valueItemProps => <ValueItem {...valueItemProps} />)}
        </div>
    );
};

interface ValueItemProps {
    bulletColor: string;
    title: string;
    description: string;
}

export const ValueItem: React.StatelessComponent<ValueItemProps> = ({ bulletColor, title, description }) => {
    return (
        <div style={{ minHeight: VALUE_ITEM_MIN_HEIGHT }}>
            <ListItem bulletColor={bulletColor}>
                <Text fontWeight="bold" fontSize="16x" fontColor={colors.black}>
                    {title}
                </Text>
            </ListItem>
            <ListItem>
                <Text className="pt1" fontSize="16x" lineHeight="2em" fontColor={colors.black}>
                    {description}
                </Text>
            </ListItem>
        </div>
    );
};
