import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { BulletedItemProps } from 'ts/pages/jobs/bulleted_item';
import { BulletedItemList } from 'ts/pages/jobs/bulleted_item_list';

const BULLETED_ITEMS: BulletedItemProps[] = [
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

export const Values = () => <BulletedItemList headerText="Our Values" bulletedItems={BULLETED_ITEMS} />;
