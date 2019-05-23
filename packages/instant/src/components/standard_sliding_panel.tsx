import * as React from 'react';

import { StandardSlidingPanelContent, StandardSlidingPanelSettings } from '../types';

import { InstallWalletPanelContent } from './install_wallet_panel_content';
import { SlidingPanel } from './sliding_panel';

export interface StandardSlidingPanelProps extends StandardSlidingPanelSettings {
    onClose: () => void;
}

export class StandardSlidingPanel extends React.PureComponent<StandardSlidingPanelProps> {
    public render(): React.ReactNode {
        const { animationState, content, onClose } = this.props;
        return (
            <SlidingPanel animationState={animationState} onClose={onClose}>
                {this._getNodeForContent(content)}
            </SlidingPanel>
        );
    }
    private readonly _getNodeForContent = (content: StandardSlidingPanelContent): React.ReactNode => {
        switch (content) {
            case StandardSlidingPanelContent.InstallWallet:
                return <InstallWalletPanelContent />;
            case StandardSlidingPanelContent.None:
                return null;
        }
    };
}
