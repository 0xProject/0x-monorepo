import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

const SHOW_DURATION_MS = 4000;

interface SidebarHeaderProps {
    title: string;
    iconUrl: string;
}

interface SidebarHeaderState {}

export class SidebarHeader extends React.Component<SidebarHeaderProps, SidebarHeaderState> {
    public render(): React.ReactNode {
        return (
            <div className="pt2 md-px1 sm-px2" style={{ color: colors.black, paddingBottom: 18 }}>
                <div className="flex" style={{ fontSize: 25 }}>
                    <div style={{ fontWeight: 'bold', fontFamily: 'Roboto Mono' }}>0x</div>
                    <div className="pl2" style={{ lineHeight: 1.4, fontWeight: 300 }}>
                        docs
                    </div>
                </div>
                <div className="pl1" style={{ color: colors.grey350, paddingBottom: 9, paddingLeft: 10, height: 17 }}>
                    |
                </div>
                <div className="flex">
                    <div>
                        <img src={this.props.iconUrl} width="22" />
                    </div>
                    <div className="pl1" style={{ fontWeight: 600, fontSize: 20, lineHeight: 1.2 }}>
                        {this.props.title}
                    </div>
                </div>
            </div>
        );
    }
}
