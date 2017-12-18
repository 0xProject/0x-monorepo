import * as _ from 'lodash';
import * as React from 'react';
import {Link as ScrollLink} from 'react-scroll';
import * as ReactTooltip from 'react-tooltip';
import {DocsInfo} from 'ts/pages/documentation/docs_info';
import {TypeDefinition} from 'ts/pages/documentation/type_definition';
import {Type as TypeDef, TypeDefinitionByName, TypeDocTypes} from 'ts/types';
import {colors} from 'ts/utils/colors';
import {constants} from 'ts/utils/constants';
import {utils} from 'ts/utils/utils';

// Some types reference other libraries. For these types, we want to link the user to the relevant documentation.
const typeToUrl: {[typeName: string]: string} = {
    Web3: constants.WEB3_DOCS_URL,
    Provider: constants.WEB3_PROVIDER_DOCS_URL,
    BigNumber: constants.BIGNUMBERJS_GITHUB_URL,
    DecodedLogEntryEvent: constants.WEB3_DECODED_LOG_ENTRY_EVENT_URL,
    LogEntryEvent: constants.WEB3_LOG_ENTRY_EVENT_URL,
};

const typePrefix: {[typeName: string]: string} = {
    Provider: 'Web3',
    DecodedLogEntryEvent: 'Web3',
    LogEntryEvent: 'Web3',
};

const typeToSection: {[typeName: string]: string} = {
    ExchangeWrapper: 'exchange',
    TokenWrapper: 'token',
    TokenRegistryWrapper: 'tokenRegistry',
    EtherTokenWrapper: 'etherToken',
    ProxyWrapper: 'proxy',
    TokenTransferProxyWrapper: 'proxy',
    OrderStateWatcher: 'orderWatcher',
};

interface TypeProps {
    type: TypeDef;
    docsInfo: DocsInfo;
    typeDefinitionByName?: TypeDefinitionByName;
}

// The return type needs to be `any` here so that we can recursively define <Type /> components within
// <Type /> components (e.g when rendering the union type).
export function Type(props: TypeProps): any {
    const type = props.type;
    const isReference = type.typeDocType === TypeDocTypes.Reference;
    const isArray = type.typeDocType === TypeDocTypes.Array;
    let typeNameColor = 'inherit';
    let typeName: string|React.ReactNode;
    let typeArgs: React.ReactNode[] = [];
    switch (type.typeDocType) {
        case TypeDocTypes.Intrinsic:
        case TypeDocTypes.Unknown:
            typeName = type.name;
            typeNameColor = colors.orange;
            break;

        case TypeDocTypes.Reference:
            typeName = type.name;
            typeArgs = _.map(type.typeArguments, (arg: TypeDef) => {
                if (arg.typeDocType === TypeDocTypes.Array) {
                    const key = `type-${arg.elementType.name}-${arg.elementType.typeDocType}`;
                    return (
                        <span>
                            <Type
                                key={key}
                                type={arg.elementType}
                                typeDefinitionByName={props.typeDefinitionByName}
                                docsInfo={props.docsInfo}
                            />[]
                        </span>
                    );
                } else {
                    const subType = (
                        <Type
                            key={`type-${arg.name}-${arg.value}-${arg.typeDocType}`}
                            type={arg}
                            typeDefinitionByName={props.typeDefinitionByName}
                            docsInfo={props.docsInfo}
                        />
                    );
                    return subType;
                }
            });
            break;

        case TypeDocTypes.StringLiteral:
            typeName = `'${type.value}'`;
            typeNameColor = colors.green;
            break;

        case TypeDocTypes.Array:
            typeName = type.elementType.name;
            break;

        case TypeDocTypes.Union:
            const unionTypes = _.map(type.types, t => {
                return (
                    <Type
                        key={`type-${t.name}-${t.value}-${t.typeDocType}`}
                        type={t}
                        typeDefinitionByName={props.typeDefinitionByName}
                        docsInfo={props.docsInfo}
                    />
                );
            });
            typeName = _.reduce(unionTypes, (prev: React.ReactNode, curr: React.ReactNode) => {
                return [prev, '|', curr];
            });
            break;

        case TypeDocTypes.TypeParameter:
            typeName = type.name;
            break;

        default:
            throw utils.spawnSwitchErr('type.typeDocType', type.typeDocType);
    }
    // HACK: Normalize BigNumber to simply BigNumber. For some reason the type
    // name is unpredictably one or the other.
    if (typeName === 'BigNumber') {
        typeName = 'BigNumber';
    }
    const commaSeparatedTypeArgs = _.reduce(typeArgs, (prev: React.ReactNode, curr: React.ReactNode) => {
        return [prev, ', ', curr];
    });

    const typeNameUrlIfExists = typeToUrl[(typeName as string)];
    const typePrefixIfExists = typePrefix[(typeName as string)];
    const sectionNameIfExists = typeToSection[(typeName as string)];
    if (!_.isUndefined(typeNameUrlIfExists)) {
        typeName = (
            <a
                href={typeNameUrlIfExists}
                target="_blank"
                className="text-decoration-none"
                style={{color: colors.lightBlueA700}}
            >
                {!_.isUndefined(typePrefixIfExists) ? `${typePrefixIfExists}.` : ''}{typeName}
            </a>
        );
    } else if ((isReference || isArray) &&
                (props.docsInfo.isPublicType(typeName as string) ||
                !_.isUndefined(sectionNameIfExists))) {
        const id = Math.random().toString();
        const typeDefinitionAnchorId = _.isUndefined(sectionNameIfExists) ? typeName : sectionNameIfExists;
        let typeDefinition;
        if (props.typeDefinitionByName) {
            typeDefinition = props.typeDefinitionByName[typeName as string];
        }
        typeName = (
            <ScrollLink
                to={typeDefinitionAnchorId}
                offset={0}
                duration={constants.DOCS_SCROLL_DURATION_MS}
                containerId={constants.DOCS_CONTAINER_ID}
            >
            {_.isUndefined(typeDefinition) || utils.isUserOnMobile() ?
                <span
                    onClick={utils.setUrlHash.bind(null, typeDefinitionAnchorId)}
                    style={{color: colors.lightBlueA700, cursor: 'pointer'}}
                >
                    {typeName}
                </span> :
                <span
                    data-tip={true}
                    data-for={id}
                    onClick={utils.setUrlHash.bind(null, typeDefinitionAnchorId)}
                    style={{color: colors.lightBlueA700, cursor: 'pointer', display: 'inline-block'}}
                >
                    {typeName}
                    <ReactTooltip
                        type="light"
                        effect="solid"
                        id={id}
                        className="typeTooltip"
                    >
                        <TypeDefinition
                            customType={typeDefinition}
                            shouldAddId={false}
                            docsInfo={props.docsInfo}
                        />
                    </ReactTooltip>
                </span>
            }
            </ScrollLink>
        );
    }
    return (
        <span>
            <span style={{color: typeNameColor}}>{typeName}</span>
            {isArray && '[]'}{!_.isEmpty(typeArgs) &&
                <span>
                    {'<'}{commaSeparatedTypeArgs}{'>'}
                </span>
            }
        </span>
    );
}
