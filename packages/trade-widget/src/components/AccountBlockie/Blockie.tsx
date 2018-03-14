import * as PropTypes from 'prop-types';
import * as React from 'react';

interface IdenticonPropTypes {
    seed: string;
    size?: number;
    scale?: number;
    color?: string;
    bgColor?: string;
    spotColor?: string;
    [key: string]: any;
}

/* tslint:disable:member-access prefer-function-over-method */
class Blockie extends React.Component<IdenticonPropTypes> {
    public identicon: any;
    constructor(props: IdenticonPropTypes) {
        super(props);
        this.generateIdenticon = this.generateIdenticon.bind(this);
    }

    componentDidMount() {
        this.generateIdenticon({ ...this.props });
    }

    componentWillUpdate(nextProps: IdenticonPropTypes) {
        if (!this.isEquivalent(this.props, nextProps)) {
            this.generateIdenticon({ ...nextProps });
        }
    }

    isEquivalent(prevProps: IdenticonPropTypes, nextProps: IdenticonPropTypes) {
        const aProps = Object.getOwnPropertyNames(prevProps);
        const bProps = Object.getOwnPropertyNames(nextProps);

        if (aProps.length !== bProps.length) {
            return false;
        }

        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < aProps.length; i++) {
            const propName = aProps[i];

            if (prevProps[propName] !== nextProps[propName]) {
                return false;
            }
        }

        return true;
    }

    generateIdenticon(options: any) {
        // NOTE --  Majority of this code is referenced from: https://github.com/alexvandesande/blockies
        //          Mostly to ensure congruence to Ethereum Mist's Identicons

        // The random number is a js implementation of the Xorshift PRNG
        const randseed = new Array(4); // Xorshift: [x, y, z, w] 32 bit values

        // tslint:disable:no-shadowed-variable
        function seedrand(seed: string) {
            for (let i = 0; i < randseed.length; i++) {
                randseed[i] = 0;
            }
            for (let i = 0; i < seed.length; i++) {
                // tslint:disable-next-line:no-bitwise
                randseed[i % 4] = (randseed[i % 4] << 5) - randseed[i % 4] + seed.charCodeAt(i);
            }
        }

        function rand() {
            // based on Java's String.hashCode(), expanded to 4 32bit values
            // tslint:disable-next-line:no-bitwise
            const t = randseed[0] ^ (randseed[0] << 11);

            randseed[0] = randseed[1];
            randseed[1] = randseed[2];
            randseed[2] = randseed[3];
            // tslint:disable-next-line:no-bitwise
            randseed[3] = randseed[3] ^ (randseed[3] >> 19) ^ t ^ (t >> 8);

            // tslint:disable-next-line:no-bitwise
            return (randseed[3] >>> 0) / ((1 << 31) >>> 0);
        }

        function createColor() {
            // saturation is the whole color spectrum
            const h = Math.floor(rand() * 360);
            // saturation goes from 40 to 100, it avoids greyish colors
            const s = rand() * 60 + 40;
            // lightness can be anything from 0 to 100, but probabilities are a bell curve around 50%
            const l = (rand() + rand() + rand() + rand()) * 25;

            // const color = 'hsl(' + h + '%' + ',' + s + '%' + ',' + l + ')';
            const color = `hsl(${h},${s}%,${l}%)`;
            return color;
        }

        function createImageData(size: number) {
            const width = size; // Only support square icons for now
            const height = size;

            const dataWidth = Math.ceil(width / 2);
            const mirrorWidth = width - dataWidth;

            const data = [];
            for (let y = 0; y < height; y++) {
                let row = [];
                for (let x = 0; x < dataWidth; x++) {
                    // this makes foreground and background color to have a 43% (1/2.3) probability
                    // spot color has 13% chance
                    row[x] = Math.floor(rand() * 2.3);
                }
                const r = row.slice(0, mirrorWidth);
                r.reverse();
                row = row.concat(r);

                // tslint:disable-next-line:prefer-for-of
                for (let i = 0; i < row.length; i++) {
                    data.push(row[i]);
                }
            }

            return data;
        }

        function setCanvas(identicon: any, imageData: any, color: string, scale: number, bgcolor: string, spotcolor: string) {
            const width = Math.sqrt(imageData.length);
            const size = width * scale;

            identicon.width = size;
            identicon.style.width = `${size}px`;

            identicon.height = size;
            identicon.style.height = `${size}px`;

            const cc = identicon.getContext('2d');
            cc.fillStyle = bgcolor;
            cc.fillRect(0, 0, identicon.width, identicon.height);
            cc.fillStyle = color;

            for (let i = 0; i < imageData.length; i++) {
                // if data is 2, choose spot color, if 1 choose foreground
                cc.fillStyle = imageData[i] === 1 ? color : spotcolor;

                // if data is 0, leave the background
                if (imageData[i]) {
                    const row = Math.floor(i / width);
                    const col = i % width;

                    cc.fillRect(col * scale, row * scale, scale, scale);
                }
            }
        }

        const opts = options || {};
        const size = opts.size || 8;
        const scale = opts.scale || 4;
        const seed = opts.seed || Math.floor(Math.random() * Math.pow(10, 16)).toString(16);

        seedrand(seed);

        const color = opts.color || createColor();
        const bgcolor = opts.bgColor || createColor();
        const spotcolor = opts.spotColor || createColor();
        const imageData = createImageData(size);
        const canvas = setCanvas(this.identicon, imageData, color, scale, bgcolor, spotcolor);

        return canvas;
    }

    // tslint:disable-next-line:member-access
    render() {
        return (
            <canvas
                style={{borderRadius: '15px', border: '2px solid rgba(230,230,230,0.8)', boxShadow: '1px 1px rgba(230,230,230,0.3)'}}
                ref={identicon => {
                    this.identicon = identicon;
                }}
                className="identicon"
            />
        );
    }
}

export { Blockie };
