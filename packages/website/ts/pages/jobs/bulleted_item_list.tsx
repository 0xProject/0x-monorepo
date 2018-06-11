import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

export type BulletedItemInfo = BulletedItemProps;
export interface BulletedItemListProps {
    headerText?: string;
    bulletedItemInfos: BulletedItemInfo[];
}
export const BulletedItemList = (props: BulletedItemListProps) => {
    return (
        <div className="mx-auto max-width-4">
            {!_.isUndefined(props.headerText) && (
                <div
                    className="h2 lg-py4 md-py4 sm-py3"
                    style={{
                        paddingLeft: 90,
                        fontFamily: 'Roboto Mono',
                        minHeight: '1.25em',
                        lineHeight: 1.25,
                    }}
                >
                    {props.headerText}
                </div>
            )}

            <div className="px2">
                {_.map(props.bulletedItemInfos, bulletedItemProps => {
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

interface BulletedItemProps {
    bulletColor: string;
    title: string;
    description: string;
    height?: number;
}
const BulletedItem = (props: BulletedItemProps) => {
    const minHeight = props.height || 150;
    return (
        <div className="flex" style={{ minHeight }}>
            <svg className="flex-none px2" height="26" width="26">
                <circle cx="13" cy="13" r="13" fill={props.bulletColor} />
            </svg>
            <div className="flex-auto px2">
                <div style={{ paddingTop: 3, fontWeight: 'bold', fontSize: 16 }}>{props.title}</div>
                <div style={{ paddingTop: 12, fontSize: 16, lineHeight: 2 }}>{props.description}</div>
            </div>
        </div>
    );
};
