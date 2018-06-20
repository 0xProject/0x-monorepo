import blockies = require('blockies');
import * as _ from 'lodash';
import * as React from 'react';

import { Image } from 'ts/components/ui/image';
import { colors } from 'ts/style/colors';

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
        const address = this.props.address;
        const diameter = this.props.diameter;
        const radius = diameter / 2;
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
                {!_.isEmpty(address) ? (
                    <Image
                        src={blockies({
                            seed: address.toLowerCase(),
                        }).toDataURL()}
                        height={diameter}
                        width={diameter}
                    />
                ) : (
                    <svg height={diameter} width={diameter}>
                        <circle cx={radius} cy={radius} r={radius} fill={colors.grey200} />
                    </svg>
                )}
            </div>
        );
    }
}
