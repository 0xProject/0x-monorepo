import * as React from 'react';
import styled from 'styled-components';

import { HeaderSizes, Styles } from 'ts/types';
import { colors } from 'ts/utils/colors';

import { Link } from './link';

export interface AnchorTitleProps {
    title: string | React.ReactNode;
    id: string;
    headerSize: HeaderSizes;
    shouldShowAnchor: boolean;
    isDisabled: boolean;
}

export interface AnchorTitleState {}

const styles: Styles = {
    h1: {
        fontSize: '1.875em',
    },
    h2: {
        fontSize: '1.5em',
        fontWeight: 400,
    },
    h3: {
        fontSize: '1.17em',
    },
};

interface AnchorIconProps {
    shouldShowAnchor: boolean;
}

const AnchorIcon = styled.i<AnchorIconProps>`
    opacity: ${props => (props.shouldShowAnchor ? 1 : 0)};
    &:hover {
        opacity: ${props => (props.shouldShowAnchor ? 0.6 : 0)};
    }
    font-size: 20px;
    transform: rotate(45deg);
    cursor: pointer;
`;

export class AnchorTitle extends React.Component<AnchorTitleProps, AnchorTitleState> {
    public static defaultProps: Partial<AnchorTitleProps> = {
        isDisabled: false,
    };
    public render(): React.ReactNode {
        return (
            <div
                className="relative flex"
                style={
                    {
                        ...styles[this.props.headerSize],
                        fontWeight: 'bold',
                        display: 'block',
                        WebkitMarginStart: 0,
                        WebkitMarginEnd: 0,
                    } as any
                }
            >
                <div className="inline-block" style={{ paddingRight: 4, color: colors.darkestGrey }}>
                    {this.props.title}
                </div>
                {!this.props.isDisabled && (
                    <Link to={this.props.id}>
                        <AnchorIcon className="zmdi zmdi-link" shouldShowAnchor={this.props.shouldShowAnchor} />
                    </Link>
                )}
            </div>
        );
    }
}
