import blockies = require('blockies');
import * as _ from 'lodash';
import * as React from 'react';

import { Circle } from 'ts/components/ui/circle';
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
        return (
            <div
                className="circle relative transitionFix"
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
                    <Circle diameter={diameter} fillColor={colors.grey200} />
                )}
            </div>
        );
    }
}
