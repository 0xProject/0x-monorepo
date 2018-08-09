import * as _ from 'lodash';
import * as React from 'react';

export interface ImageProps {
    className?: string;
    src?: string;
    fallbackSrc?: string;
    borderRadius?: string;
    width?: string | number;
    height?: string | number;
    maxWidth?: string | number;
    maxHeight?: string | number;
}
interface ImageState {
    imageLoadFailed: boolean;
}
export class Image extends React.Component<ImageProps, ImageState> {
    constructor(props: ImageProps) {
        super(props);
        this.state = {
            imageLoadFailed: false,
        };
    }
    public render(): React.ReactNode {
        const src =
            this.state.imageLoadFailed || _.isUndefined(this.props.src) ? this.props.fallbackSrc : this.props.src;
        return (
            <img
                className={this.props.className}
                onError={this._onError.bind(this)}
                src={src}
                style={{
                    borderRadius: this.props.borderRadius,
                    maxWidth: this.props.maxWidth,
                    maxHeight: this.props.maxHeight,
                }}
                height={this.props.height}
                width={this.props.width}
            />
        );
    }
    private _onError(): void {
        this.setState({
            imageLoadFailed: true,
        });
    }
}
