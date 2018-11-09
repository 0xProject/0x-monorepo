import * as React from 'react';

import { SlideAnimationState, StandardSlidingPanelContent, StandardSlidingPanelSettings } from '../types';

import { SlidingPanel } from './sliding_panel';

export interface StandardSlidingPanelProps extends StandardSlidingPanelSettings {
    onClose: () => void;
}

export class StandardSlidingPanel extends React.Component<StandardSlidingPanelProps> {
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
            case StandardSlidingPanelContent.InstallMetaMask:
                return 'Install MetaMask';
            default:
                return null;
        }
    };
}
