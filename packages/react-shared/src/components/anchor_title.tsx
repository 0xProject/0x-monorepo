import * as React from 'react';
import { Link as ScrollLink } from 'react-scroll';
import styled from 'styled-components';

import { HeaderSizes, Styles } from '../types';
import { colors } from '../utils/colors';
import { constants } from '../utils/constants';

const headerSizeToScrollOffset: { [headerSize: string]: number } = {
    h2: -20,
    h3: 0,
};

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

const AnchorIcon =
    styled.i <
    AnchorIconProps >
    `
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
                    <ScrollLink
                        to={this.props.id}
                        hashSpy={true}
                        offset={headerSizeToScrollOffset[this.props.headerSize]}
                        duration={constants.DOCS_SCROLL_DURATION_MS}
                        containerId={constants.SCROLL_CONTAINER_ID}
                    >
                        <AnchorIcon className="zmdi zmdi-link" shouldShowAnchor={this.props.shouldShowAnchor} />
                    </ScrollLink>
                )}
            </div>
        );
    }
}
