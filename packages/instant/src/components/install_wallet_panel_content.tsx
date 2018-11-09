import * as React from 'react';

import { METAMASK_CHROME_STORE_URL } from '../constants';
import { ColorOption } from '../style/theme';

import { MetaMaskLogo } from './meta_mask_logo';
import { StandardPanelContent } from './standard_panel_content';
import { Button } from './ui/button';

export interface InstallWalletPanelContentProps {}

export const InstallWalletPanelContent: React.StatelessComponent<InstallWalletPanelContentProps> = () => (
    <StandardPanelContent
        image={<MetaMaskLogo width={85} height={80} />}
        title="Install MetaMask"
        description="Please install the MetaMask wallet extension from the Chrome Store."
        action={
            <Button
                href={METAMASK_CHROME_STORE_URL}
                width="100%"
                fontSize="16px"
                fontColor={ColorOption.white}
                backgroundColor={ColorOption.darkOrange}
            >
                Get Chrome Extension
            </Button>
        }
    />
);
