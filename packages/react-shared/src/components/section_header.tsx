import * as React from 'react';
import { Element as ScrollElement } from 'react-scroll';

import { HeaderSizes } from '../types';
import { colors } from '../utils/colors';
import { utils } from '../utils/utils';

import { AnchorTitle } from './anchor_title';

export interface SectionHeaderProps {
    sectionName: string;
    headerSize?: HeaderSizes;
}

interface DefaultSectionHeaderProps {
    headerSize: HeaderSizes;
}

type PropsWithDefaults = SectionHeaderProps & DefaultSectionHeaderProps;

export interface SectionHeaderState {
    shouldShowAnchor: boolean;
}

export class SectionHeader extends React.Component<SectionHeaderProps, SectionHeaderState> {
    public static defaultProps: Partial<SectionHeaderProps> = {
        headerSize: HeaderSizes.H2,
    };
    constructor(props: SectionHeaderProps) {
        super(props);
        this.state = {
            shouldShowAnchor: false,
        };
    }
    public render(): React.ReactNode {
        const { sectionName, headerSize } = this.props as PropsWithDefaults;

        const finalSectionName = utils.convertDashesToSpaces(this.props.sectionName);
        const id = utils.getIdFromName(finalSectionName);
        return (
            <div
                onMouseOver={this._setAnchorVisibility.bind(this, true)}
                onMouseOut={this._setAnchorVisibility.bind(this, false)}
            >
                <ScrollElement name={id}>
                    <AnchorTitle
                        headerSize={headerSize}
                        title={
                            <span
                                style={{
                                    textTransform: 'capitalize',
                                    color: colors.grey,
                                    fontFamily: 'Roboto Mono',
                                    fontWeight: 300,
                                    fontSize: 27,
                                }}
                            >
                                {finalSectionName}
                            </span>
                        }
                        id={id}
                        shouldShowAnchor={this.state.shouldShowAnchor}
                    />
                </ScrollElement>
            </div>
        );
    }
    private _setAnchorVisibility(shouldShowAnchor: boolean): void {
        this.setState({
            shouldShowAnchor,
        });
    }
}
