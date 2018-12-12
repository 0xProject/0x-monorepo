import * as React from 'react';
import styled from 'styled-components';
import {SiteWrap} from 'ts/@next/components/siteWrap';

import {SectionLandingAbout} from 'ts/@next/components/sections/landing/about';
import {SectionLandingClients} from 'ts/@next/components/sections/landing/clients';
import {SectionLandingCta} from 'ts/@next/components/sections/landing/cta';
import {SectionLandingHero} from 'ts/@next/components/sections/landing/hero';

import { ModalContact } from 'ts/@next/components/modals/modal_contact';

import LogoOutlined from 'ts/@next/icons/illustrations/logo-outlined.svg';

interface Props {
    theme: {
        bgColor: string;
        textColor: string;
        linkColor: string;
    };
}

export class NextLanding extends React.Component<Props> {
    public state = {
        isContactModalOpen: false,
    };
    public render(): React.ReactNode {
        return  (
            <SiteWrap theme="dark">
                <SectionLandingHero />
                <SectionLandingAbout />
                <SectionLandingClients />
                <SectionLandingCta onContactClick={this._onOpenContactModal.bind(this)} />
                <ModalContact isOpen={this.state.isContactModalOpen} onDismiss={this._onDismissContactModal.bind(this)} />
            </SiteWrap>
        );
    }

    private _onOpenContactModal(e): void {
        e.preventDefault();
        
        this.setState({ isContactModalOpen: true });
    }

    private _onDismissContactModal(): void {
        this.setState({ isContactModalOpen: false });
    }
}
