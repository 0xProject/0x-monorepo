import { AnchorTitle, HeaderSizes } from '@0xproject/react-shared/anchor_title';
import * as React from 'react';
import { Element as ScrollElement } from 'react-scroll';
import { colors } from 'ts/utils/colors';
import { utils } from 'ts/utils/utils';

interface SectionHeaderProps {
    sectionName: string;
    headerSize?: HeaderSizes;
}

interface SectionHeaderState {
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
    public render() {
        const sectionName = this.props.sectionName.replace(/-/g, ' ');
        const id = utils.getIdFromName(sectionName);
        return (
            <div
                onMouseOver={this._setAnchorVisibility.bind(this, true)}
                onMouseOut={this._setAnchorVisibility.bind(this, false)}
            >
                <ScrollElement name={id}>
                    <AnchorTitle
                        headerSize={this.props.headerSize}
                        title={
                            <span
                                style={{
                                    textTransform: 'uppercase',
                                    color: colors.grey,
                                    fontFamily: 'Roboto Mono',
                                    fontWeight: 300,
                                    fontSize: 27,
                                }}
                            >
                                {sectionName}
                            </span>
                        }
                        id={id}
                        shouldShowAnchor={this.state.shouldShowAnchor}
                    />
                </ScrollElement>
            </div>
        );
    }
    private _setAnchorVisibility(shouldShowAnchor: boolean) {
        this.setState({
            shouldShowAnchor,
        });
    }
}
