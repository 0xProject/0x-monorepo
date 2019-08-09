import * as _ from 'lodash';
import * as React from 'react';

import { DocumentTitle } from 'ts/components/document_title';
import { Column, Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { ListItem, OrderedList } from 'ts/components/textList';
import { documentConstants } from 'ts/utils/document_meta_constants';

export const PrivacyPolicy = () => (
    <SiteWrap theme="light">
        <DocumentTitle {...documentConstants.PRIVACY_POLICY} />
        <Section>
            <Column>
                <Heading size="medium" isCentered={true}>
                    Privacy Policy
                </Heading>
                <Heading asElement="h4" size="small" marginBottom="50px" isMuted={true} isCentered={true}>
                    Last Updated: August 8th 2019
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    This Privacy Policy explains how ZEROEX, Inc. and any of its subsidiaries or affiliates, including
                    ZeroEx International SEZC (collectively, “ZeroEx”, “we”, “our” or “us”) collects, uses, and
                    discloses personal data or other information about you (“Personal Information”) collected through
                    our website <a href="https://0x.org">https://0x.org</a> (the “Site”), and the products, features,
                    content, applications, or services we provide (collectively with the Site, the “Services”). We
                    encourage you to read the Privacy Policy carefully. When you use the Services, you are consenting to
                    the collection, transfer, storage, disclosure, and other uses of your information as described in
                    this Privacy Policy.
                </Paragraph>

                <Heading asElement="h3" size="small" textAlign="left">
                    Why Do You Collect My Information?
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    We collect your Personal Information to provide, maintain, and improve our Services. To be more
                    specific, we primarily use your Personal Information to:
                </Paragraph>
                <OrderedList marginBottom="30px">
                    <ListItem>
                        Communicate with you about our news, products, services, events, technical updates, and any
                        information that you request through the Services or that we think you might be interested;
                    </ListItem>
                    <ListItem>
                        Track and analyze activities, usage, trends, numbers, and market insights related to our
                        Services;
                    </ListItem>
                    <ListItem>Detect, prevent, and address security or technical issues;</ListItem>
                    <ListItem>
                        Prevent illegal activities and protect the rights and property of ZeroEx and the users; and
                    </ListItem>
                    <ListItem>
                        Facilitate our work with vendors, agents, consultants, and other service providers.
                    </ListItem>
                </OrderedList>

                <Heading asElement="h3" size="small" textAlign="left">
                    What Information Do You Collect and How Is It Collected?
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    <strong>Information You Choose to Share:</strong> We collect information you directly share with us.
                    When you apply for a job, fill out a survey, request support, use any interactive features of the
                    Services, or communicate with us in other ways, you choose to provide the information to us.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    <strong>IP Address and Device Information:</strong> When you use our Services, we collect log
                    information including your IP address, browser type, time of visit, pages viewed, and any other log
                    information typically shared through interacting with websites. We also obtain information about the
                    device you use to access our Services, including operating system, model of the computer or mobile
                    device, mobile network, and any other information about your device.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    <strong>Information Collected by Cookies:</strong> Cookies are small data files stored on your
                    computer’s hard drive by websites that you visit. Our Site is using Cookies, which help us
                    understand trends and quality of visits. We use information collected by Cookies to enhance
                    effectiveness of our Services and improve your experience.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    <strong>Email Communication:</strong> If you subscribe to our newsletter with your email address, we
                    may from time to time communicate news, updates, promotional information, marketing materials and
                    other information related to ZeroEx, and the Services. If you want to opt out of receiving such
                    emails from us, you can opt out by clicking “unsubscribe” in any of the emails we sent you.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    We may also collect and store information that you share with us through email, including inquiries,
                    requests, feedback, and any other information you choose to provide.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    <strong>Social Media :</strong> We are using plugins from social networks such as GitHub, Twitter,
                    Discord, Facebook, Reddit, Medium, YouTube on the Site. When you click on a plugin, the associated
                    social network may collect your data, including the data of your visits on the Site, in accordance
                    with their respective privacy policies. We are not responsible for data collected by these social
                    networks. Please check with these social networks on their privacy policies.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    <strong>Information Collected From Other Sources:</strong> We may receive information from other
                    sources, including third party service providers. This helps us evaluate and improve our Services.
                </Paragraph>

                <Heading asElement="h3" size="small" textAlign="left">
                    How My Information Is Shared?
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    We may share your Personal Information with third parties including vendors, marketing agencies,
                    consultants, agents, or other service providers if such sharing is necessary to facilitate our work
                    with the third parties;
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    We may also share your Personal Information as we reasonably believe is necessary to 1) comply with
                    any applicable law, regulation, or valid directive from law enforcement or a court; 2) detect,
                    prevent or address any security or technical issues; 3) enforce this Privacy Policy, or Terms of
                    Service; 4) protect rights, property or safety of 0x or others;
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    We have the right to share your Personal Information between and among ZeroEx (current and future)
                    parents, subsidiaries or any other affiliates. You acknowledge that in cases where we may choose to
                    sell or transfer our business assets, your Personal Information may be transferred or acquired by a
                    third party, and that any acquirer of our assets may continue to use your Personal Information as
                    provided in this Privacy Policy.
                </Paragraph>

                <Heading asElement="h3" size="small" textAlign="left">
                    What Rights Or Choices Do I Have?
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You have the right to obtain from us a copy of your Personal Information that we collected. You may
                    also update, rectify, or delete your Personal Information anytime, by emailing us at:{' '}
                    <a href="mailto:legal@0x.org">legal@0x.org</a>. However, we may keep the cached or archived
                    information for a period of time.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You may unsubscribe our email communications or opt out of receiving promotional communications from
                    us by completing the instructed steps in those communications or by emailing us at:{' '}
                    <a href="mailto:legal@0x.org">legal@0x.org</a>.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You may also stop us from sharing your Personal Information with third party service providers,
                    including marketing agencies, by sending us a request at:{' '}
                    <a href="mailto:legal@0x.org">legal@0x.org</a>.
                </Paragraph>

                <Heading asElement="h3" size="small" textAlign="left">
                    Is My Information Secure With You?
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    We are making reasonable efforts to protect your Personal Information. While we are continuously
                    improving our security measures, we cannot guarantee the security of your Personal Information. You
                    should be aware that unauthorized entry or use, technical system failures, and other factors, may
                    jeopardize your Personal Information.
                </Paragraph>

                <Heading asElement="h3" size="small" textAlign="left">
                    How Long Do You Keep My Information?
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    We store your Personal Information only for the period necessary for the purpose(s) for which we
                    originally collect the information, or as required by applicable laws.
                </Paragraph>

                <Heading asElement="h3" size="small" textAlign="left">
                    How Do You Update the Privacy Policy?
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    We may amend this Privacy Policy at any time by posting the amended version on the Services
                    including the date of the amendment. If we make changes, we will notify you by posting an
                    announcement on the Services or sending you an email. Your use of the Services after any changes to
                    the Privacy Policy constitutes your consent to the changes and you are bound by the amended Privacy
                    Policy.
                </Paragraph>

                <Heading asElement="h3" size="small" textAlign="left">
                    What If My Information Is Transferred To Foreign Countries?
                </Heading>

                <Paragraph size="default" isMuted={true} textAlign="left">
                    We process and store your information in the U.S. However, we and our service providers may transfer
                    your Personal Information to, or store it in, foreign countries. We will make efforts to ensure that
                    we comply with local legal requirements and that your information receives adequate protection in
                    foreign jurisdictions.
                </Paragraph>

                <Heading asElement="h3" size="small" textAlign="left">
                    What If I Have Questions About the Privacy Policy?
                </Heading>

                <Paragraph size="default" isMuted={true} textAlign="left">
                    If you have any questions regarding this Privacy Policy, please contact us at:{' '}
                    <a href="mailto:legal@0x.org">legal@0x.org</a>.
                </Paragraph>
            </Column>
        </Section>
    </SiteWrap>
);
