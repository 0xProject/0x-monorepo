import blockies = require('blockies');
import * as _ from 'lodash';
import * as React from 'react';
import { constants } from 'ts/utils/constants';

interface IdenticonProps {
    address: string;
    diameter: number;
    style?: React.CSSProperties;
}

interface IdenticonState {}

export class Identicon extends React.Component<IdenticonProps, IdenticonState> {
    public static defaultProps: Partial<IdenticonProps> = {
        style: {},
    };
    public render(): React.ReactNode {
        let address = this.props.address;
        if (_.isEmpty(address)) {
            address = constants.NULL_ADDRESS;
        }
        const diameter = this.props.diameter;
        const icon = blockies({
            seed: address.toLowerCase(),
        });
        return (
            <div
                className="circle mx-auto relative transitionFix"
                style={{
                    width: diameter,
                    height: diameter,
                    overflow: 'hidden',
                    ...this.props.style,
                }}
            >
                <img
                    src={icon.toDataURL()}
                    style={{
                        width: diameter,
                        height: diameter,
                        imageRendering: 'pixelated',
                    }}
                />
            </div>
        );
    }
}
