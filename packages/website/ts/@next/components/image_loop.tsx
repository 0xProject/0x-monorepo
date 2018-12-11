import * as React from 'react';
import * as _ from 'lodash/collection';
import styled from 'styled-components';

interface Props {
    name: string;
    size?: 'small' | 'medium' | 'large' | number;
}

export class ImageLoop extends React.Component<Props> {
    private _img: Image;
    private _ctx: CanvasRenderingContext2D;
    private _x = 0;
    private _speed = -1;
    private _canvas = React.createRef();

    constructor(props: Props) {
        super(props);
    }
    public componentDidMount(): void {
        const domImage = React.Children.only(this.props.children);

        this._img = new Image(1446, 407);
        this._img.src = domImage.props.src;
        this._ctx = this._canvas.current.getContext('2d');

        this._img.onload = this.updateCanvas.bind(this);
    }
    public render(): React.ReactNode {
        return (
            <Wrapper {...this.props}>
                <canvas id="canvas" style={{ width: '100vw', height: '407px' }} ref={this._canvas} />
            </Wrapper>
        );
    }
    public updateCanvas(): void {
        this.move();

        const { width, height } = this._canvas.current;

        this._ctx.clearRect(0, 0, width, height);
        this.draw();

        requestAnimationFrame(this.updateCanvas.bind(this));
    }
    public move(): void {
        this._x += this._speed;
        this._x %= this._canvas.current.width;
    }
    public draw(): void {
        const img = this._img;
        const imgWidth = img.naturalWidth / 2;
        const imgHeight = img.naturalHeight / 2;
        const currentPosition = this._x;
        const canvasWidth = this._canvas.current.width;

        this._ctx.drawImage(img, currentPosition, 0, imgWidth, imgHeight);

        if (this._speed < 0) {
            this._ctx.drawImage(img, currentPosition + canvasWidth, 0, imgWidth, imgHeight);
        } else {
            this._ctx.drawImage(img, currentPosition - imgWidth, 0, imgWidth, imgHeight);
        }
    }
}

export const Wrapper = styled.div`
    margin: 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
`;
