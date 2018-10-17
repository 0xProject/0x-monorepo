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
    anchor: {
        fontSize: 20,
        transform: 'rotate(45deg)',
        cursor: 'pointer',
    },
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

export class AnchorTitle extends React.Component<AnchorTitleProps, AnchorTitleState> {
    public static defaultProps: Partial<AnchorTitleProps> = {
        isDisabled: false,
    };
    public render(): React.ReactNode {
        const AnchorIcon = styled.i`
            opacity: ${this.props.shouldShowAnchor ? 1 : 0};
            &:hover {
                opacity: ${this.props.shouldShowAnchor ? 0.6 : 0};
            }
        `;
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
                        <AnchorIcon className="zmdi zmdi-link" style={{ ...styles.anchor }} />
                    </ScrollLink>
                )}
            </div>
        );
    }
}
