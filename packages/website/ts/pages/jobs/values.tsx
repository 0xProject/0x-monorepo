import * as _ from 'lodash';
import * as React from 'react';

import { HeaderItem } from 'ts/pages/jobs/list/header_item';
import { ListItem } from 'ts/pages/jobs/list/list_item';

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
            {_.map(VALUE_ITEM_PROPS_LIST, valueItemProps => React.createElement(ValueItem, valueItemProps))}
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
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{title}</div>
            </ListItem>
            <ListItem>
                <div className="pt1" style={{ fontSize: 16, lineHeight: 2 }}>
                    {description}
                </div>
            </ListItem>
        </div>
    );
};
