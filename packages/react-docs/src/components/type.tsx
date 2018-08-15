import { colors, constants as sharedConstants, utils as sharedUtils } from '@0xproject/react-shared';
import { errorUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { Link as ScrollLink } from 'react-scroll';
import * as ReactTooltip from 'react-tooltip';

import { DocsInfo } from '../docs_info';
import { Type as TypeDef, TypeDefinitionByName, TypeDocTypes } from '../types';
import { constants } from '../utils/constants';

import { Signature } from './signature';
import { TypeDefinition } from './type_definition';

const basicJsTypes = ['string', 'number', 'undefined', 'null', 'boolean'];

const defaultProps = {};

export interface TypeProps {
    type: TypeDef;
    docsInfo: DocsInfo;
    sectionName: string;
    typeDefinitionByName?: TypeDefinitionByName;
    isInPopover: boolean;
}

// The return type needs to be `any` here so that we can recursively define <Type /> components within
// <Type /> components (e.g when rendering the union type).
export const Type: React.SFC<TypeProps> = (props: TypeProps): any => {
    const type = props.type;
    const isReference = type.typeDocType === TypeDocTypes.Reference;
    const isArray = type.typeDocType === TypeDocTypes.Array;
    let typeNameColor = 'inherit';
    let typeName: string | React.ReactNode;
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
                                type={arg}
                                sectionName={props.sectionName}
                                typeDefinitionByName={props.typeDefinitionByName}
                                docsInfo={props.docsInfo}
                                isInPopover={props.isInPopover}
                            />[]
                        </span>
                    );
                } else {
                    const subType = (
                        <Type
                            key={`type-${arg.name}-${arg.value}-${arg.typeDocType}`}
                            type={arg}
                            sectionName={props.sectionName}
                            typeDefinitionByName={props.typeDefinitionByName}
                            docsInfo={props.docsInfo}
                            isInPopover={props.isInPopover}
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
            if (_.includes(basicJsTypes, typeName)) {
                typeNameColor = colors.orange;
            }
            break;

        case TypeDocTypes.Union:
            const unionTypes = _.map(type.types, t => {
                return (
                    <Type
                        key={`type-${t.name}-${t.value}-${t.typeDocType}`}
                        type={t}
                        sectionName={props.sectionName}
                        typeDefinitionByName={props.typeDefinitionByName}
                        docsInfo={props.docsInfo}
                        isInPopover={props.isInPopover}
                    />
                );
            });
            typeName = _.reduce(unionTypes, (prev: React.ReactNode, curr: React.ReactNode) => {
                return [prev, '|', curr];
            });
            break;

        case TypeDocTypes.Reflection:
            if (!_.isUndefined(type.method)) {
                typeName = (
                    <Signature
                        name={type.method.name}
                        returnType={type.method.returnType}
                        parameters={type.method.parameters}
                        typeParameter={type.method.typeParameter}
                        sectionName={props.sectionName}
                        shouldHideMethodName={true}
                        shouldUseArrowSyntax={true}
                        docsInfo={props.docsInfo}
                        typeDefinitionByName={props.typeDefinitionByName}
                        isInPopover={props.isInPopover}
                    />
                );
            } else if (!_.isUndefined(type.indexSignature)) {
                const is = type.indexSignature;
                const param = (
                    <span key={`indexSigParams-${is.keyName}-${is.keyType}-${type.name}`}>
                        {is.keyName}:{' '}
                        <Type
                            type={is.keyType}
                            sectionName={props.sectionName}
                            docsInfo={props.docsInfo}
                            typeDefinitionByName={props.typeDefinitionByName}
                            isInPopover={props.isInPopover}
                        />
                    </span>
                );
                typeName = (
                    <span key={`indexSignature-${type.name}-${is.keyType.name}`}>
                        {'{'}[{param}]: {is.valueName}
                        {'}'}
                    </span>
                );
            } else {
                throw new Error(`Unrecognized Reflection type that isn't a Method nor an Index Signature`);
            }

            break;

        case TypeDocTypes.TypeParameter:
            typeName = type.name;
            break;

        case TypeDocTypes.Intersection:
            const intersectionsTypes = _.map(type.types, t => {
                return (
                    <Type
                        key={`type-${t.name}-${t.value}-${t.typeDocType}`}
                        type={t}
                        sectionName={props.sectionName}
                        typeDefinitionByName={props.typeDefinitionByName}
                        docsInfo={props.docsInfo}
                        isInPopover={props.isInPopover}
                    />
                );
            });
            typeName = _.reduce(intersectionsTypes, (prev: React.ReactNode, curr: React.ReactNode) => {
                return [prev, '&', curr];
            });
            break;

        default:
            throw errorUtils.spawnSwitchErr('type.typeDocType', type.typeDocType);
    }
    // HACK: Normalize BigNumber to simply BigNumber. For some reason the type
    // name is unpredictably one or the other.
    if (typeName === 'BigNumber') {
        typeName = 'BigNumber';
    }
    const commaSeparatedTypeArgs = _.reduce(typeArgs, (prev: React.ReactNode, curr: React.ReactNode) => {
        return [prev, ', ', curr];
    });

    const isExportedClassReference = !!props.type.isExportedClassReference;
    const typeNameUrlIfExists = !_.isUndefined(props.type.externalLink) ? props.type.externalLink : undefined;
    if (!_.isUndefined(typeNameUrlIfExists)) {
        typeName = (
            <a
                href={typeNameUrlIfExists}
                target="_blank"
                className="text-decoration-none"
                style={{ color: colors.lightBlueA700 }}
            >
                {typeName}
            </a>
        );
    } else if (
        (isReference || isArray) &&
        ((props.typeDefinitionByName && props.typeDefinitionByName[typeName as string]) || isExportedClassReference)
    ) {
        const id = Math.random().toString();
        const typeDefinitionAnchorId = isExportedClassReference
            ? props.type.name
            : `${constants.TYPES_SECTION_NAME}-${typeName}`;
        typeName = (
            <ScrollLink
                to={typeDefinitionAnchorId}
                offset={0}
                hashSpy={true}
                duration={sharedConstants.DOCS_SCROLL_DURATION_MS}
                containerId={sharedConstants.DOCS_CONTAINER_ID}
            >
                {sharedUtils.isUserOnMobile() || props.isInPopover || isExportedClassReference ? (
                    <span style={{ color: colors.lightBlueA700, cursor: 'pointer' }}>{typeName}</span>
                ) : (
                    <span
                        data-tip={true}
                        data-for={id}
                        style={{
                            color: colors.lightBlueA700,
                            cursor: 'pointer',
                            display: 'inline-block',
                        }}
                    >
                        {typeName}
                        <ReactTooltip type="light" effect="solid" id={id} className="typeTooltip">
                            <TypeDefinition
                                sectionName={props.sectionName}
                                customType={props.typeDefinitionByName[typeName as string]}
                                shouldAddId={false}
                                docsInfo={props.docsInfo}
                                typeDefinitionByName={props.typeDefinitionByName}
                                isInPopover={true}
                            />
                        </ReactTooltip>
                    </span>
                )}
            </ScrollLink>
        );
    }
    return (
        <span>
            <span style={{ color: typeNameColor }}>{typeName}</span>
            {isArray && '[]'}
            {!_.isEmpty(typeArgs) && (
                <span>
                    {'<'}
                    {commaSeparatedTypeArgs}
                    {'>'}
                </span>
            )}
        </span>
    );
};

Type.defaultProps = defaultProps;
