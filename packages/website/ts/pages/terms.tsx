import * as _ from 'lodash';
import * as React from 'react';

import { DocumentTitle } from 'ts/components/document_title';
import { Column, Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { documentConstants } from 'ts/utils/document_meta_constants';

export const TermsOfService = () => (
    <SiteWrap theme="light">
        <DocumentTitle {...documentConstants.TERMS_OF_SERVICE} />
        <Section>
            <Column>
                <Heading size="medium" isCentered={true}>
                    Terms of Service
                </Heading>
                <Heading asElement="h4" size="small" marginBottom="50px" isMuted={true} isCentered={true}>
                    These terms of service are effective as of August 8, 2019
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Thank you for your interest in 0x. These terms of service, together with any documents and
                    additional terms they incorporate by reference (collectively, these “Terms”), are entered into
                    between ZeroEx Inc. and any of its subsidiaries or affiliates, including ZeroEx International SEZC
                    (collectively, “ZeroEx,” “we,” “us,” and “our”) and you or the company or other legal entity that
                    you represent (“you” or “your”).
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Please read these Terms carefully as they govern your use of our website located at our Site{' '}
                    <a href="https://0x.org">https://0x.org</a> (the “Site”), and use of the products, features,
                    content, applications, or services we provide (collectively with the Site, the “Services”). These
                    terms describe your rights and obligations and our disclaimers and limitations of legal liability.
                    By accessing or using our Site or our Services, you accept and agree to be bound by and to comply
                    with these Terms, including the mandatory arbitration provision in Section 12. If you do not agree
                    to these Terms, you must not access or use our Site or the Services. Please carefully review the
                    disclosures and disclaimers set forth in Section 8 in their entirety before using any software
                    developed by ZeroEx.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You must be able to form a legally binding contract online either on behalf of a company or as an
                    individual. Accordingly, you represent that, if you are agreeing to these Terms on behalf of a
                    company or other legal entity, you have the legal authority to bind the company or other legal
                    entity to these Terms and you are at least 18 years old (or the age of majority where you reside,
                    whichever is older), can form a legally binding contract online, and have the full, right, power and
                    authority to enter into and to comply with the obligations under these Terms.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Additionally, you represent and warrant that you are not a citizen or resident of a state, country,
                    territory or other jurisdiction that is embargoed by the Cayman Islands or the United States or
                    where your use of the Site or the Services would be illegal or otherwise violate any domestic or
                    foreign law, rule, statute, regulation, by-law, order, protocol, code, decree, or other directive,
                    requirement or guideline, published or in force which applies to or is otherwise intended to govern
                    or regulate any person, property, transaction, activity, event or other matter, including any rule,
                    order, judgment, directive or other requirement or guideline issued by any domestic or foreign
                    federal, provincial or state, municipal, local or other governmental, regulatory, judicial or
                    administrative authority having jurisdiction over ZeroEx, you, the Site or the Services, or as
                    otherwise duly enacted, enforceable by law, the common law or equity (“Applicable Law”).
                </Paragraph>

                <Heading asElement="h3" size="small" textAlign="left">
                    1. MODIFICATIONS TO THESE TERMS
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    We reserve the right, in our sole discretion, to modify these Terms from time to time. If we make
                    changes, we will provide you with notice of such changes by sending an email, providing a notice
                    through the Site or our Services or updating the date at the top of these Terms. Unless we say
                    otherwise in our notice, any modifications are effective immediately, and your continued use of the
                    Site or our Services will confirm your acceptance of the changes. If you do not agree to the amended
                    Terms, you must stop using our Services.
                </Paragraph>
                <Heading asElement="h3" size="small" textAlign="left">
                    2. SERVICES
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    The 0x smart contracts are publicly available open source software programs deployed on the Ethereum
                    blockchain that facilitate the peer-to-peer exchange of Ethereum-based tokens.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    ZeroEx helps develops open source software through which users and developers can interact with the
                    0x smart contracts. The primary purpose of the Site is to enable users to access this open source
                    software as well as to provide resources and information designed to allow users to utilize the open
                    source software, including, without limitation, developer documentation, product examples, and other
                    related services (all which are covered under the definition of “Services”).
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    The “0x network” is comprised of all users, companies, applications, and any other device, service
                    or person interacting in any way, directly or indirectly, with the the 0x smart contracts on the
                    Ethereum blockchain, including ZeroEx’s Services. The term 0x network should be interpreted as
                    broadly as possible to include anything that may be reasonably considered to be part of the network
                    as that term is construed in normal use.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Some Services offered by us or other participants in the 0x network require payment or otherwise
                    involve the use of an underlying blockchain or other decentralized or permissioned infrastructure
                    (the “Distributed Ledger Technology”), which may require that you pay a fee, such as “gas” charges
                    on the Ethereum network, for the computational resources required to perform a transaction on the
                    particular Distributed Ledger Technology (such payments and fees, “Charges”).
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You acknowledge and agree that ZeroEx has no control over any Distributed Ledger Technology
                    transactions, the method of payment of any Charges, if applicable, or any actual payments of
                    Charges, if applicable. Accordingly, you must ensure that you have a sufficient balance of the
                    applicable Distributed Ledger Technology network tokens stored at your Distributed Ledger
                    Technology-compatible wallet address (“Distributed Ledger Technology Address”) to complete any
                    transaction on the 0x network or the Distributed Ledger Technology before initiating such
                    transaction.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    As a condition to accessing or using the Services or the Site, you: (i) will only use the Services
                    and the Site for lawful purposes and in accordance with these Terms; (ii) will ensure that all
                    information that you provide on the Site is current, complete, and accurate; (iii) will maintain the
                    security and confidentiality of access to your Distributed Ledger Technology Address; and (iv) agree
                    (A) that no Protected Party (defined below) will be responsible for any loss or damage incurred as
                    the result of any interactions you have with other users of the Site, Services or the 0x network,
                    including any loss of the tokens issued by ZeroEx (“ZRX Tokens”), any other tokens or other unit of
                    value; and (B) if there is a dispute between you and any other site or other user, no Protected
                    Party will be under any obligation to become involved.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    As a condition to accessing or using the Site or the Services, you will not: (i) Violate any
                    Applicable Law, including, without limitation, any relevant and applicable anti-money laundering and
                    anti-terrorist financing laws and any relevant and applicable privacy and data collection laws, in
                    each case as may be amended; (ii) Export, reexport, or transfer, directly or indirectly, any ZeroEx
                    technology in violation of applicable export laws or regulations; (iii) Infringe on or
                    misappropriate any contract, intellectual property or other third-party right, or commit a tort
                    while using the Site or the Services; (iv) Misrepresent the truthfulness, sourcing or reliability of
                    any content on the Site or through the Services; (v) Use the Site or Services in any manner that
                    could interfere with, disrupt, negatively affect, or inhibit other users from fully enjoying the
                    Site, Services or the 0x network, or that could damage, disable, overburden, or impair the
                    functioning of the Site, Services or the 0x network in any manner; (vi) Attempt to circumvent any
                    content filtering techniques or security measures that ZeroEx employs on the Site or the Services,
                    or attempt to access any service or area of the Site or the Services that you are not authorized to
                    access; (vii) Use any robot, spider, crawler, scraper, or other automated means or interface not
                    provided by us, to access the Site or Services or to extract data; (viii) Introduce any malware,
                    virus, Trojan horse, worm, logic bomb, drop-dead device, backdoor, shutdown mechanism or other
                    harmful material into the Site or the Services; (ix) Post content or communications on the Site or
                    through the Services that are, in our sole discretion, libelous, defamatory, profane, obscene,
                    pornographic, sexually explicit, indecent, lewd, vulgar, suggestive, harassing, hateful,
                    threatening, offensive, discriminatory, bigoted, abusive, inflammatory, fraudulent, deceptive or
                    otherwise objectionable; (x) Post content on the Site or through the Services containing unsolicited
                    promotions, political campaigning, or commercial messages or any chain messages or user content
                    designed to deceive or trick the user of the Service; or (xi) Encourage or induce any third party to
                    engage in any of the activities prohibited under these Terms.
                </Paragraph>
                <Heading asElement="h3" size="small" textAlign="left">
                    3. PRIVACY POLICY
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Please refer to our privacy policy available at{' '}
                    <a href="https://0x.org/privacy">https://0x.org/privacy</a> for information about how we collect,
                    use, share and otherwise process information about you.
                </Paragraph>
                <Heading asElement="h3" size="small" textAlign="left">
                    4. PROPRIETARY RIGHTS
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Excluding any open source software or third-party software that the Site or the Services
                    incorporates, as between you and ZeroEx, ZeroEx owns the Site and the Services, including all
                    technology, content and other materials used, displayed or provided on the Site (including all
                    intellectual property rights), and hereby grants you a limited, revocable, non-transferable, license
                    to access and use those portions of the Site and the Services that are proprietary to ZeroEx in
                    accordance with their intended uses and using their designated public interfaces.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Certain of the Services are governed by the most recent version of the open source licenses,
                    including the Apache 2.0 license, a copy of which (as it applies to the Site and the Services) can
                    be found at:{' '}
                    <a href="http://www.apache.org/licenses/LICENSE-2.0">http://www.apache.org/licenses/LICENSE-2.0</a>{' '}
                    (as of the date these Terms were last updated) and any other applicable licensing terms for the Site
                    and the Services in these Terms (collectively, the “ZeroEx License”). You acknowledge that the Site,
                    the Services or the 0x Network may use, incorporate or link to certain open-source components and
                    that your use of the Site, Services and/or the 0x Network is subject to, and you will comply with
                    any, applicable open-source licenses that govern any such open-source components (collectively,
                    “Open-Source Licenses”). Without limiting the generality of the foregoing, you may not resell,
                    lease, lend, share, distribute or otherwise permit any third party to use the Site or the Services
                    or otherwise use the Site or the Services in a manner that violates the ZeroEx License or any other
                    Open-Source Licenses.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Any of ZeroEx’s product or service names, logos, and other marks used in the Site or as a part of
                    the Services, including ZeroEx's name and logo are trademarks owned by ZeroEx, its affiliates or its
                    applicable licensors. You may generally use ZeroEx’s name and logo to refer to ZeroEx’s products or
                    services, provided that it does not in any way suggest or imply sponsorship or approval by ZeroEx.
                    You may also indicate the relationship of your products and services to ZeroEx’s products or
                    services by using an accurate descriptive term in connection with your product or service. You may
                    not use ZeroEx’s name and logo in a manner that may cause confusion with others or result in
                    genericization. ZeroEx reserves its right to prohibit the use of the ZeroEx marks by anyone we
                    believe misuses our trademarks. Except as provided in the foregoing, you may not copy, imitate or
                    use them without ZeroEx’s (or the applicable licensor’s) prior written consent.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    ZeroEx will be free to use, disclose, reproduce, license, and otherwise distribute and exploit any
                    suggestions, comments, or other feedback provided by you to ZeroEx with respect to the Site or
                    Services (“Feedback”) provided to it as it sees fit, entirely without obligation or restriction of
                    any kind, on account of intellectual property rights or otherwise.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    ZeroEx may host or provide links to Sites and other content of third parties (“Third Party
                    Content”). ZeroEx makes no claim or representation regarding, and accepts no responsibility for,
                    Third Party Content or for the quality, accuracy, nature, ownership or reliability thereof. Your use
                    these links and the Third Party Content at your own risk. When you leave the Site, you should be
                    aware that our terms and policies no longer govern. You should review the applicable terms and
                    policies, including privacy and data gathering practices, of any Site to which you navigate from the
                    Site.
                </Paragraph>
                <Heading asElement="h3" size="small" textAlign="left">
                    5. CHANGES; SUSPENSION; TERMINATION
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    The 0x Network is intended to be decentralized and self-operating, with or without any Services
                    provided by ZeroEx. Accordingly, we may, at our sole discretion, from time to time and with or
                    without prior notice to you, modify, suspend or disable, temporarily or permanently, the Services
                    offered by ZeroEx, in whole or in part, for any reason whatsoever, including, but not limited to, as
                    a result of a security incident.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    We will not be liable for any losses suffered by you resulting from any modification to any Services
                    or from any suspension or termination, for any reason, of your access to all or any portion of the
                    Site or the Services.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    All of these terms will survive any termination of your access to the Site or the Services,
                    regardless of the reasons for its expiration or termination, in addition to any other provision
                    which by law or by its nature should survive.
                </Paragraph>

                <Heading asElement="h3" size="small" textAlign="left">
                    6. ELECTRONIC NOTICES
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You consent to receive all communications, agreements, documents, receipts, notices, and disclosures
                    electronically (collectively, our “Communications”) that we provide in connection with these Terms
                    or any Services. You agree that we may provide our Communications to you by posting them on the Site
                    or through the Services or by emailing them to you at the email address you provide in connection
                    with using the Services. You should maintain copies of our Communications by printing a paper copy
                    or saving an electronic copy. You may also contact our support team to request additional electronic
                    copies of our Communications by filing a support request at{' '}
                    <a href="mailto:legal@0x.org">legal@0x.org</a>
                </Paragraph>

                <Heading asElement="h3" size="small" textAlign="left">
                    7. INDEMNIFICATION
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You will defend, indemnify, and hold harmless ZeroEx, our affiliates, and our affiliates’ respective
                    shareholders, members, directors, officers, employees, attorneys, agents, representatives,
                    suppliers, licensors and contractors (collectively, “Protected Parties”) from any claim, demand,
                    lawsuit, action, proceeding, investigation, liability, damage, loss, cost or expense, including
                    without limitation reasonable attorneys’ fees, arising out of or relating to your use of, or conduct
                    in connection with, the Site, Services, the 0x Network or ZRX Tokens, Distributed Ledger Technology
                    assets associated with your Distributed Ledger Technology Address, any other digital assets, any
                    Feedback or Your Content; your violation of these Terms; your violation of applicable laws or
                    regulations; or your infringement or misappropriation of the rights of any other person or entity.
                    If you are obligated to indemnify any Protected Party, ZeroEx (or, at its discretion, the applicable
                    Protected Party) will have the right, in its sole discretion, to control any action or proceeding
                    and to determine whether ZeroEx wishes to settle, and if so, on what terms.
                </Paragraph>
                <Heading asElement="h3" size="small" textAlign="left">
                    8. DISCLOSURES; DISCLAIMERS
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    ZeroEx is primarily a developer of open-source software. ZeroEx does not operate a virtual currency
                    or derivatives exchange platform or offer trade execution or clearing services and therefore has no
                    oversight, involvement, or control with respect to your transactions, including ZRX Tokens purchases
                    and sales.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You are responsible for complying with all laws and regulations applicable to your transactions,
                    including, but not limited to, the Commodity Exchange Act and the regulations promulgated thereunder
                    by the U.S. Commodity Futures Trading Commission (“CFTC”), the Bank Secrecy Act and the regulations
                    promulgated thereunder by the Financial Crimes Enforcement Network (“FinCEN”), and the federal
                    securities laws and the regulations promulgated thereunder by the U.S. Securities and Exchange
                    Commission (“SEC”).
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You understand that ZeroEx is not registered or licensed by the CFTC, SEC, FinCEN, or any financial
                    regulatory authority. No financial regulatory authority has reviewed or approved the use of the
                    ZeroEx open-source software or Services. This Site and the Services do not constitute advice or a
                    recommendation concerning any commodity, security or other asset. ZeroEx is not acting as an
                    investment adviser or commodity trading adviser to any person.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    ZeroEx operate or control the underlying software protocols that are used in connection with the ZRX
                    Tokens or the 0x smart contracts beyond currently maintaining the ability to shut down the 0x smart
                    contracts. In general, the underlying protocols are open-source and anyone can use, copy, modify,
                    and distribute them. ZeroEx is not responsible for operation of the underlying protocols such as
                    Ethereum, and ZeroEx makes no guarantee of their functionality, security, or availability.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    To the maximum extent permitted under Applicable Law, the Site and the Services (and any of their
                    content or functionality) provided by or on behalf of us are provided on an “AS IS” and “AS
                    AVAILABLE” basis, and we expressly disclaim, and you hereby waive, any representations, conditions
                    or warranties of any kind, whether express or implied, legal, statutory or otherwise, or arising
                    from statute, otherwise in law, course of dealing, or usage of trade, including, without limitation,
                    the implied or legal warranties and conditions of merchantability, merchantable quality, quality or
                    fitness for a particular purpose, title, security, availability, reliability, accuracy, quiet
                    enjoyment and non-infringement of third party rights. Without limiting the foregoing, we do not
                    represent or warrant that the Site or the Services (including any related data) will be
                    uninterrupted, available at any particular time or error-free. Further, we do not warrant that
                    errors in the Site or the Service are correctable or will be corrected.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You acknowledge that your data on the Site or through the Services may become irretrievably lost or
                    corrupted or temporarily unavailable due to a variety of causes, and agree that, to the maximum
                    extent permitted under Applicable Law, we will not be liable for any loss or damage caused by
                    denial-of-service attacks, software failures, viruses or other technologically harmful materials
                    (including those which may infect your computer equipment), protocol changes by third party
                    providers, Internet outages, force majeure events or other disasters, scheduled or unscheduled
                    maintenance, or other causes either within or outside our control.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    The disclaimer of implied warranties contained in these Terms may not apply if and to the extent
                    such warranties cannot be excluded or limited under the Applicable Law of the jurisdiction in which
                    you reside.
                </Paragraph>
                <Heading asElement="h3" size="small" textAlign="left">
                    9. EXCLUSION OF CONSEQUENTIAL AND RELATED DAMAGES
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    In no event will the Company, together with any Protected Party, be liable for any incidental,
                    indirect, special, punitive, exemplary, consequential or similar damages or liabilities whatsoever
                    (including, without limitation, damages for loss of data, information, revenue, goodwill, profits or
                    other business or financial benefit) arising out of or in connection with the Site, the Services and
                    the 0x Network (and any of their content and functionality), any execution or settlement of a
                    transaction, any performance or non-performance of the Services, your Distributed Ledger Technology
                    assets, other digital assets, ZRX Tokens or any other product, service or other item provided by or
                    on behalf of a Protected Party, whether under contract, tort (including negligence), civil
                    liability, statute, strict liability, breach of warranties, or under any other theory of liability,
                    and whether or not any Protected Party has been advised of, knew of or should have known of the
                    possibility of such damages and notwithstanding any failure of the essential purpose of these Terms
                    or any limited remedy nor is ZeroEx in any way responsible for the execution or settlement of
                    transactions between users of ZeroEx open-source software or the 0x Network.
                </Paragraph>
                <Heading asElement="h3" size="small" textAlign="left">
                    10. LIMITATION OF LIABILITY
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    In no event will the Protected Parties' aggregate liability arising out of or in connection with the
                    Site, the Services and the 0x Network (and any of their content and functionality), any performance
                    or non-performance of the Services, your Distributed Ledger Technology assets, other digital assets,
                    ZRX Tokens or any other product, service or other item provided by or on behalf of a Protected
                    Party, whether under contract, tort (including negligence), civil liability, statute, strict
                    liability or other theory of liability exceed the amount of fees paid by you to us under these Terms
                    in the twelve (12) month period immediately preceding the event giving rise to the claim for
                    liability.
                </Paragraph>
                <Heading asElement="h3" size="small" textAlign="left">
                    11. RELEASE
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    To the extent permitted by applicable law, in consideration for being allowed to use the Site, the
                    Services and/or the 0x Network, you hereby release and forever discharge the Company and all
                    Protected Parties from, and hereby waive and relinquish, each and every past, present and future
                    dispute, claim, controversy, demand, right, obligation, liability, action and cause of action of
                    every kind and nature (including personal injuries, death, and property damage), that has arisen or
                    arises directly or indirectly out of, or that relates directly or indirectly to, the Site, the
                    Services and/or the 0x Network (including any interactions with, or act or omission of, other Site
                    or 0x Network users or any third-party services). YOU HEREBY WAIVE ANY APPLICABLE PROVISION IN LAW
                    OR REGULATION IN CONNECTION WITH THE FOREGOING, WHICH STATES IN SUBSTANCE: “A GENERAL RELEASE DOES
                    NOT EXTEND TO CLAIMS WHICH THE CREDITOR DOES NOT KNOW OR SUSPECT TO EXIST IN HIS OR HER FAVOR AT THE
                    TIME OF EXECUTING THE RELEASE, WHICH IF KNOWN BY HIM OR HER MUST HAVE MATERIALLY AFFECTED HIS OR HER
                    SETTLEMENT WITH THE DEBTOR.”
                </Paragraph>
                <Heading asElement="h3" size="small" textAlign="left">
                    12. DISPUTE RESOLUTION AND ARBITRATION
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Please read the following section carefully because it requires you to arbitrate certain disputes
                    and claims with ZeroEx and limits the manner in which you can seek relief from us, unless you opt
                    out of arbitration by following the instructions set forth below. In addition, arbitration precludes
                    you from suing in court or having a jury trial.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You and ZeroEx agree that any dispute arising out of or related to these Terms or our Services is
                    personal to you and ZeroEx and that any dispute will be resolved solely through individual action,
                    and will not be brought as a class arbitration, class action or any other type of representative
                    proceeding.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Except for small claims disputes in which you or ZeroEx seeks to bring an individual action in small
                    claims court located in the county or other applicable jurisdiction where you reside or disputes in
                    which you or ZeroEx seeks injunctive or other equitable relief for the alleged unlawful use of
                    intellectual property, you and ZeroEx waive your rights to a jury trial and to have any dispute
                    arising out of or related to these Terms or our Services resolved in court. Instead, for any dispute
                    or claim that you have against ZeroEx or relating in any way to the Services, you agree to first
                    contact ZeroEx and attempt to resolve the claim informally by sending a written notice of your claim
                    (“Notice”) to ZeroEx by email at <a href="mailto:legal@0x.org">legal@0x.org</a>. The Notice must
                    include your name, residence address, email address, and telephone number, describe the nature and
                    basis of the claim and set forth the specific relief sought. Our notice to you will be similar in
                    form to that described above. If you and ZeroEx cannot reach an agreement to resolve the claim
                    within thirty (30) days after such Notice is received, then either party may submit the dispute to
                    binding arbitration administered by the JAMS, or, under the limited circumstances set forth above,
                    in court. All disputes submitted to JAMS will be resolved through confidential, binding arbitration
                    before one arbitrator. Arbitration proceedings will be held in California, in accordance with the
                    JAMS Comprehensive Arbitration Rules & Procedures (“JAMS Rules”). The most recent version of the
                    JAMS Rules are available on the JAMS Site and are hereby incorporated by reference. You either
                    acknowledge and agree that you have read and understand the JAMS Rules or waive your opportunity to
                    read the JAMS Rules and waive any claim that the JAMS Rules are unfair or should not apply for any
                    reason.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You and ZeroEx agree that the enforceability of this Section 12 will be substantively and
                    procedurally governed by the Federal Arbitration Act, 9 U.S.C. § 1, et seq. (the “FAA”), to the
                    maximum extent permitted by applicable law. As limited by the FAA, these Terms and the AAA Rules,
                    the arbitrator will have exclusive authority to make all procedural and substantive decisions
                    regarding any dispute and to grant any remedy that would otherwise be available in court, including
                    the power to determine the question of arbitrability. The arbitrator may conduct only an individual
                    arbitration and may not consolidate more than one individual’s claims, preside over any type of
                    class or representative proceeding or preside over any proceeding involving more than one
                    individual.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    The arbitrator, ZeroEx, and you will maintain the confidentiality of any arbitration proceedings,
                    judgments and awards, including, but not limited to, all information gathered, prepared and
                    presented for purposes of the arbitration or related to the disputes. The arbitrator will have the
                    authority to make appropriate rulings to safeguard confidentiality, unless the law provides to the
                    contrary. The duty of confidentiality does not apply to the extent that disclosure is necessary to
                    prepare for or conduct the arbitration hearing on the merits, in connection with a court application
                    for a preliminary remedy or in connection with a judicial challenge to an arbitration award or its
                    enforcement, or to the extent that disclosure is otherwise required by law or judicial decision.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You and ZeroEx agree that for any arbitration you initiate, you will pay the filing fee and ZeroEx
                    will pay the remaining AAA fees and costs. For any arbitration initiated by ZeroEx, ZeroEx will pay
                    all AAA fees and costs. You and ZeroEx agree that the courts of Grand Cayman sitting in the Cayman
                    Islands have exclusive jurisdiction over any appeals and the enforcement of an arbitration award.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Any claim arising out of or related to these Terms or our Services must be filed within one year
                    after such claim arose; otherwise, the claim is permanently barred, which means that you and ZeroEx
                    will not have the right to assert the claim.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    You have the right to opt out of binding arbitration within 30 days of the date you first accepted
                    the terms of this Section 12 by emailing us at <a href="mailto:legal@0x.org">legal@0x.org</a>. In
                    order to be effective, the opt-out notice must include your full name and address and clearly
                    indicate your intent to opt out of binding arbitration. By opting out of binding arbitration, you
                    are agreeing to resolve disputes in accordance with Section 12.
                </Paragraph>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    If any portion of this Section 12 is found to be unenforceable or unlawful for any reason, the
                    unenforceable or unlawful provision will be severed from these Terms, severance of the unenforceable
                    or unlawful provision will have no impact whatsoever on the remainder of this Section 12 or the
                    parties’ ability to compel arbitration of any remaining claims on an individual basis under this
                    Section 12, and to the extent that any claims must therefore proceed on a class, collective,
                    consolidated, or representative basis, such claims must be litigated in a civil court of competent
                    jurisdiction and not in arbitration, and the parties agree that litigation of those claims will be
                    stayed pending the outcome of any individual claims in arbitration. Further, if any part of this
                    Section 12 is found to prohibit an individual claim seeking public injunctive relief, that provision
                    will have no effect to the extent such relief is allowed to be sought out of arbitration, and the
                    remainder of this Section 12 will be enforceable.
                </Paragraph>
                <Heading asElement="h3" size="small" textAlign="left">
                    13. GOVERNING LAW
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    The interpretation and enforcement of these Terms, and any dispute related to these Terms, the Site
                    or the Services, will be governed by and construed and enforced in accordance with the laws of the
                    California, as applicable, without regard to conflict of law rules or principles (whether of the
                    Cayman Islands or any other jurisdiction) that would cause the application of the laws of any other
                    jurisdiction. You agree that we may initiate a proceeding related to the enforcement or validity of
                    our intellectual property rights in any court having jurisdiction. With respect to any other
                    proceeding that is not subject to arbitration under these Terms, the courts located in the Cayman
                    Islands will have exclusive jurisdiction. You waive any objection to venue in any such courts.
                </Paragraph>
                <Heading asElement="h3" size="small" textAlign="left">
                    14. MISCELLANEOUS
                </Heading>
                <Paragraph size="default" isMuted={true} textAlign="left">
                    Any right or remedy of ZeroEx set forth in these Terms is in addition to, and not in lieu of, any
                    other right or remedy whether described in these Terms, under Applicable Law, at law or in equity.
                    Our failure or delay in exercising any right, power, or privilege under these Terms will not operate
                    as a waiver thereof. The invalidity or unenforceability of any of these Terms will not affect the
                    validity or enforceability of any other of these Terms, all of which will remain in full force and
                    effect. We will have no responsibility or liability for any failure or delay in performance of the
                    Site or any of the Services, or any loss or damage that you may incur, due to any circumstance or
                    event beyond our control, including without limitation any flood, extraordinary weather conditions,
                    earthquake, or other act of God, fire, war, insurrection, riot, labor dispute, accident, action of
                    government, communications, power failure, or equipment or software malfunction. You may not assign
                    or transfer any right to use the Site or the Services, or any of your rights or obligations under
                    these Terms, without our express prior written consent, including by operation of law or in
                    connection with any change of control. We may assign or transfer any or all of our rights or
                    obligations under these Terms, in whole or in part, without notice or obtaining your consent or
                    approval. Headings of sections are for convenience only and will not be used to limit or construe
                    such sections. These Terms contain the entire agreement and supersede all prior and contemporaneous
                    understandings between the parties regarding the Site and the Services. If there is a conflict
                    between these Terms and any other agreement you may have with us, these Terms will control unless
                    the other agreement specifically identifies these Terms and declares that the other agreement
                    supersedes these Terms.
                </Paragraph>
            </Column>
        </Section>
    </SiteWrap>
);
