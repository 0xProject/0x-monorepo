import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { BulletedItem, BulletedItemProps } from 'ts/pages/jobs/bulleted_item';

export interface BulletedItemListProps {
    headerText: string;
    bulletedItems: BulletedItemProps[];
}
export const BulletedItemList = (props: BulletedItemListProps) => {
    return (
        <div className="mx-auto max-width-4">
            <div className="h2 lg-py4 md-py4 sm-py3" style={{ paddingLeft: 90, fontFamily: 'Roboto Mono' }}>
                {props.headerText}
            </div>
            <div className="px2">
                {_.map(props.bulletedItems, bulletedItemProps => {
                    return (
                        <BulletedItem
                            key={bulletedItemProps.title}
                            bulletColor={bulletedItemProps.bulletColor}
                            title={bulletedItemProps.title}
                            description={bulletedItemProps.description}
                        />
                    );
                })}
            </div>
        </div>
    );
};
