import * as React from 'react';

export interface CoinbaseWalletLogoProps {
    width?: number;
    height?: number;
}

export const CoinbaseWalletLogo: React.StatelessComponent<CoinbaseWalletLogoProps> = ({ width, height }) => (
    <svg width={width} height={height} viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25.5" cy="25.5" r="25.5" fill="#3263E9" />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M25.5 41C34.0604 41 41 34.0604 41 25.5C41 16.9396 34.0604 10 25.5 10C16.9396 10 10 16.9396 10 25.5C10 34.0604 16.9396 41 25.5 41ZM21.5108 20.5107C20.9586 20.5107 20.5108 20.9584 20.5108 21.5107V29.6223C20.5108 30.1746 20.9586 30.6223 21.5108 30.6223H29.6224C30.1747 30.6223 30.6224 30.1746 30.6224 29.6223V21.5107C30.6224 20.9584 30.1747 20.5107 29.6224 20.5107H21.5108Z"
            fill="white"
        />
    </svg>
);

CoinbaseWalletLogo.displayName = 'CoinbaseWalletLogo';

CoinbaseWalletLogo.defaultProps = {
    width: 164,
    height: 164,
};
