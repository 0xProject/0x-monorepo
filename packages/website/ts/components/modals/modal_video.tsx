import React from 'react';
import CSSTransition from 'react-transition-group/CSSTransition';

interface ModalVideoClassnames {
    modalVideoEffect: string;
    modalVideo: string;
    modalVideoClose: string;
    modalVideoBody: string;
    modalVideoInner: string;
    modalVideoIframeWrap: string;
    modalVideoCloseBtn: string;
}

interface Aria {
    openMessage: string;
    dismissBtnMessage: string;
}

export interface ModalVideoProps {
    onClose?: () => void;
    isOpen: boolean;
    classNames?: ModalVideoClassnames;
    ratio?: string;
    animationSpeed?: number;
    allowFullScreen?: boolean;
    aria?: Aria;
    videoId?: string;
    channel?: string;
    youtube?: any;
    vimeo?: any;
    youku?: any;
}

export interface ModalVideoState {
    isOpen: boolean;
}

export class ModalVideo extends React.Component<ModalVideoProps, ModalVideoState> {
    public static defaultProps: ModalVideoProps = {
        channel: 'youtube',
        isOpen: false,
        youtube: {
            autoplay: 1,
            cc_load_policy: 1,
            color: null,
            controls: 1,
            disablekb: 0,
            enablejsapi: 0,
            end: null,
            fs: 1,
            h1: null,
            iv_load_policy: 1,
            list: null,
            listType: null,
            loop: 0,
            modestbranding: null,
            origin: null,
            playlist: null,
            playsinline: null,
            rel: 0,
            showinfo: 1,
            start: 0,
            wmode: 'transparent',
            theme: 'dark',
        },
        ratio: '16:9',
        vimeo: {
            api: false,
            autopause: true,
            autoplay: true,
            byline: true,
            callback: null,
            color: null,
            height: null,
            loop: false,
            maxheight: null,
            maxwidth: null,
            player_id: null,
            portrait: true,
            title: true,
            width: null,
            xhtml: false,
        },
        youku: {
            autoplay: 1,
            show_related: 0,
        },
        allowFullScreen: true,
        animationSpeed: 300,
        classNames: {
            modalVideoEffect: 'modal-video-effect',
            modalVideo: 'modal-video',
            modalVideoClose: 'modal-video-close',
            modalVideoBody: 'modal-video-body',
            modalVideoInner: 'modal-video-inner',
            modalVideoIframeWrap: 'modal-video-movie-wrap',
            modalVideoCloseBtn: 'modal-video-close-btn',
        },
        aria: {
            openMessage: 'You just openned the modal video',
            dismissBtnMessage: 'Close the modal by clicking here',
        },
    };
    public modal: any;
    public modalbtn: any;
    constructor(props: ModalVideoProps) {
        super(props);
        this.state = {
            isOpen: false,
        };
    }

    public openModal = (): void => {
        this.setState({ isOpen: true });
    };

    public closeModal = (): void => {
        this.setState({ isOpen: false });
        if (typeof this.props.onClose === 'function') {
            this.props.onClose();
        }
    };

    public keydownHandler(e: any): void {
        if (e.keyCode === 27) {
            this.closeModal();
        }
    }

    public componentDidMount(): void {
        document.addEventListener('keydown', this.keydownHandler.bind(this));
    }

    public componentDidUpdate(): void {
        if (this.props.isOpen && this.modal) {
            this.modal.focus();
        }
        this.setState({ isOpen: this.props.isOpen });
    }

    public componentWillUnmount(): void {
        document.removeEventListener('keydown', this.keydownHandler.bind(this));
    }

    public updateFocus = (e: any): void => {
        if (e.keyCode === 9) {
            e.preventDefault();
            e.stopPropagation();
            if (this.modal === document.activeElement) {
                this.modalbtn.focus();
            } else {
                this.modal.focus();
            }
        }
    };

    public getQueryString(obj: any): string {
        let url = '';
        for (const key of Object.keys(obj)) {
            if (obj.hasOwnProperty(key)) {
                if (obj[key] !== null) {
                    url += `${key}=${obj[key]}&`;
                }
            }
        }
        return url.substr(0, url.length - 1);
    }

    public getYoutubeUrl(youtube: any, videoId: string): string {
        const query = this.getQueryString(youtube);
        return `//www.youtube.com/embed/${videoId}?${query}`;
    }

    public getVimeoUrl(vimeo: any, videoId: string): string {
        const query = this.getQueryString(vimeo);
        return `//play.vimeo.com/video/${videoId}?${query}`;
    }

    public getYoukuUrl(youku: any, videoId: string): string {
        const query = this.getQueryString(youku);
        return `//player.youku.com/embed/${videoId}?${query}`;
    }

    public getVideoUrl(opt: any, videoId: string): string {
        if (opt.channel === 'youtube') {
            return this.getYoutubeUrl(opt.youtube, videoId);
        } else if (opt.channel === 'vimeo') {
            return this.getVimeoUrl(opt.vimeo, videoId);
        } else if (opt.channel === 'youku') {
            return this.getYoukuUrl(opt.youku, videoId);
        }
        return '';
    }

    public getPadding(ratio: string): string {
        const arr = ratio.split(':');
        const width = Number(arr[0]);
        const height = Number(arr[1]);
        const padding = (height * 100) / width;
        return `${padding}%`;
    }

    public render(): React.ReactNode {
        const style = {
            paddingBottom: this.getPadding(this.props.ratio),
        };
        return (
            <CSSTransition classNames={this.props.classNames.modalVideoEffect} timeout={this.props.animationSpeed}>
                {() => {
                    if (!this.state.isOpen) {
                        return null;
                    }
                    return (
                        <div
                            className={this.props.classNames.modalVideo}
                            tabIndex={-1}
                            role="dialog"
                            aria-label={this.props.aria.openMessage}
                            onClick={this.closeModal}
                            ref={node => {
                                this.modal = node;
                            }}
                            onKeyDown={this.updateFocus}
                        >
                            <div className={this.props.classNames.modalVideoBody}>
                                <div className={this.props.classNames.modalVideoInner}>
                                    <div className={this.props.classNames.modalVideoIframeWrap} style={style}>
                                        <button
                                            className={this.props.classNames.modalVideoCloseBtn}
                                            aria-label={this.props.aria.dismissBtnMessage}
                                            ref={node => {
                                                this.modalbtn = node;
                                            }}
                                            onKeyDown={this.updateFocus}
                                        />
                                        <iframe
                                            width="920"
                                            height="460"
                                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                            src={this.getVideoUrl(this.props, this.props.videoId)}
                                            frameBorder="0"
                                            allowFullScreen={this.props.allowFullScreen}
                                            tabIndex={-1}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </CSSTransition>
        );
    }
}
