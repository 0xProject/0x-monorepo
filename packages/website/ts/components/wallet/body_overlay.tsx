import * as _ from 'lodash';
import * as React from 'react';

import { Blockchain } from 'ts/blockchain';
import { Container } from 'ts/components/ui/container';
import { Image } from 'ts/components/ui/image';
import { Island } from 'ts/components/ui/island';
import { Text } from 'ts/components/ui/text';
import { Dispatcher } from 'ts/redux/dispatcher';
import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';
import { AccountState, BrowserType, ProviderType, OperatingSystemType } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

const METAMASK_IMG_SRC = '/images/metamask_icon.png';
const TOSHI_IMG_SRC = '/images/toshi_logo.jpg';

export interface BodyOverlayProps {
    dispatcher: Dispatcher;
    userAddress: string;
    injectedProviderName: string;
    providerType: ProviderType;
    onToggleLedgerDialog: () => void;
    blockchain?: Blockchain;
    blockchainIsLoaded: boolean;
}

interface BodyOverlayState {}

export class BodyOverlay extends React.Component<BodyOverlayProps, BodyOverlayState> {
    public render(): React.ReactNode {
        const accountState = this._getAccountState();
        switch (accountState) {
            case AccountState.Locked:
                return <LockedOverlay onUseDifferentWalletClicked={this.props.onToggleLedgerDialog} />;
            case AccountState.Disconnected:
                return <DisconnectedOverlay onUseDifferentWalletClicked={this.props.onToggleLedgerDialog} />;
            case AccountState.Ready:
            case AccountState.Loading:
            default:
                return null;
        }
    }
    private _isBlockchainReady(): boolean {
        return this.props.blockchainIsLoaded && !_.isUndefined(this.props.blockchain);
    }
    private _getAccountState(): AccountState {
        return utils.getAccountState(
            this._isBlockchainReady(),
            this.props.providerType,
            this.props.injectedProviderName,
            this.props.userAddress,
        );
    }
}

interface LockedOverlayProps {
    className?: string;
    onUseDifferentWalletClicked?: () => void;
}
const PlainLockedOverlay: React.StatelessComponent<LockedOverlayProps> = ({
    className,
    onUseDifferentWalletClicked,
}) => (
    <div className={className}>
        <Container
            className="flex flex-column items-center"
            marginBottom="24px"
            marginTop="24px"
            marginLeft="48px"
            marginRight="48px"
        >
            <Image src={METAMASK_IMG_SRC} height="70px" />
            <Container marginTop="12px">
                <Text fontColor={colors.metaMaskOrange} fontSize="16px" fontWeight="bold">
                    Please Unlock MetaMask
                </Text>
            </Container>
            <UseDifferentWallet fontColor={colors.darkGrey} onClick={onUseDifferentWalletClicked} />
        </Container>
    </div>
);
const LockedOverlay = styled(PlainLockedOverlay)`
    background: ${colors.metaMaskTransparentOrange};
    border: 1px solid ${colors.metaMaskOrange};
    border-radius: 10px;
`;

interface DisconnectedOverlayProps {
    onUseDifferentWalletClicked?: () => void;
}
const DisconnectedOverlay = (props: DisconnectedOverlayProps) => {
    return (
        <div className="flex flex-column items-center">
            <GetWalletCallToAction />
            {!utils.isMobileOperatingSystem() && (
                <UseDifferentWallet fontColor={colors.mediumBlue} onClick={props.onUseDifferentWalletClicked} />
            )}
        </div>
    );
};

interface UseDifferentWallet {
    fontColor: string;
    onClick?: () => void;
}
const UseDifferentWallet = (props: UseDifferentWallet) => {
    return (
        <Container marginTop="12px">
            <Text fontColor={props.fontColor} fontSize="16px" textDecorationLine="underline" onClick={props.onClick}>
                Use a different wallet
            </Text>
        </Container>
    );
};

const GetWalletCallToAction = () => {
    const browserType = utils.getBrowserType();
    const isOnMobile = utils.isMobileOperatingSystem();
    const operatingSystem = utils.getOperatingSystem();
    const imageUrl = isOnMobile ? TOSHI_IMG_SRC : METAMASK_IMG_SRC;
    const text = isOnMobile ? 'Get Toshi Wallet' : 'Get MetaMask Wallet';
    let downloadLink;
    if (isOnMobile) {
        switch (operatingSystem) {
            case OperatingSystemType.Android:
                downloadLink = constants.URL_TOSHI_ANDROID_APP_STORE;
                break;
            case OperatingSystemType.iOS:
                downloadLink = constants.URL_TOSHI_IOS_APP_STORE;
                break;
            default:
                // Toshi is only supported on these mobile OSes - just default to iOS
                downloadLink = constants.URL_TOSHI_IOS_APP_STORE;
        }
    } else {
        switch (browserType) {
            case BrowserType.Chrome:
                downloadLink = constants.URL_METAMASK_CHROME_STORE;
                break;
            case BrowserType.Firefox:
                downloadLink = constants.URL_METAMASK_FIREFOX_STORE;
                break;
            case BrowserType.Opera:
                downloadLink = constants.URL_METAMASK_OPERA_STORE;
                break;
            default:
                downloadLink = constants.URL_METAMASK_HOMEPAGE;
        }
    }
    return (
        <a href={downloadLink} target="_blank" style={{ textDecoration: 'none' }}>
            <Island
                className="flex items-center py1 px2"
                style={{ height: 28, borderRadius: 28, backgroundColor: colors.mediumBlue }}
            >
                <Image src={imageUrl} width="28px" borderRadius="22%" />
                <Container marginLeft="8px" marginRight="12px">
                    <Text fontColor={colors.white} fontSize="16px" fontWeight={500}>
                        {text}
                    </Text>
                </Container>
            </Island>
        </a>
    );
};
