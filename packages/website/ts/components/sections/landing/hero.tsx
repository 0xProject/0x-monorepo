import * as React from 'react';

import { Button } from 'ts/components/button';
import { Hero } from 'ts/components/hero';
import { LandingAnimation } from 'ts/components/heroImage';
import { Icon } from 'ts/components/icon';

import { HeroAnimation } from 'ts/components/heroAnimation';
import { ModalVideo } from 'ts/components/modals/modal_video';
import { WebsitePaths } from 'ts/types';

// const announcement = {
//     headline: 'Vote on ZEIP-24 & ZEIP-39',
//     href: '/vote',
//     shouldOpenInNewTab: false,
// };

export interface SectionlandingHeroProps {}
export interface SectionLandingHeroState {
    isVideoOpen: boolean;
}

export class SectionLandingHero extends React.Component<SectionlandingHeroProps, SectionLandingHeroState> {
    public state: SectionLandingHeroState = {
        isVideoOpen: false,
    };

    public render(): React.ReactNode {
        const { isVideoOpen } = this.state;
        return (
            <>
                <Hero
                    title="Powering Decentralized Exchange"
                    isLargeTitle={true}
                    isFullWidth={true}
                    description="0x is an open protocol that enables the peer-to-peer exchange of assets on the Ethereum blockchain."
                    figure={<LandingAnimation image={<HeroAnimation />} />}
                    actions={<HeroActions onPlayVideoClick={this._openModalVideo} />}
                    // announcement={announcement}
                />
                <ModalVideo
                    channel="youtube"
                    isOpen={isVideoOpen}
                    videoId="c04eIt3FQ5I"
                    onClose={this._closeModalVideo}
                    youtube={{
                        autoplay: 1,
                        controls: 0,
                        showinfo: 0,
                        modestbranding: 1,
                    }}
                    ratio="21:9"
                />
            </>
        );
    }

    private _closeModalVideo = (): void => {
        this.setState({ isVideoOpen: false });
    };

    private _openModalVideo = (): void => {
        this.setState({ isVideoOpen: true });
    };
}

interface HeroActionsProps {
    onPlayVideoClick: () => void;
}

const HeroActions: React.FC<HeroActionsProps> = props => (
    <>
        <Button href="https://0x.org/docs" isInline={true}>
            Get Started
        </Button>

        <Button shouldUseAnchorTag={true} onClick={props.onPlayVideoClick} isTransparent={true} isInline={true}>
            <Icon name="play" size={16} margin={[0, 16, 0, -16]} />
            Play Video
        </Button>
    </>
);
