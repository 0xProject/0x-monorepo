import compareVersions = require('compare-versions');
import * as _ from 'lodash';
import {
    CustomType,
    CustomTypeChild,
    DocAgnosticFormat,
    DocSection,
    IndexSignature,
    KindString,
    MenuSubsectionsBySection,
    Parameter,
    Property,
    Type,
    TypeDocNode,
    TypeDocType,
    TypeDocTypes,
    TypeParameter,
    TypescriptMethod,
    ZeroExJsDocSections,
} from 'ts/types';
import {constants} from 'ts/utils/constants';
import {utils} from 'ts/utils/utils';

const TYPES_MODULE_PATH = '"src/types"';

export const sectionNameToPossibleModulePaths: {[name: string]: string[]} = {
    [ZeroExJsDocSections.zeroEx]: ['"src/0x"'],
    [ZeroExJsDocSections.exchange]: ['"src/contract_wrappers/exchange_wrapper"'],
    [ZeroExJsDocSections.tokenRegistry]: ['"src/contract_wrappers/token_registry_wrapper"'],
    [ZeroExJsDocSections.token]: ['"src/contract_wrappers/token_wrapper"'],
    [ZeroExJsDocSections.etherToken]: ['"src/contract_wrappers/ether_token_wrapper"'],
    [ZeroExJsDocSections.proxy]: [
        '"src/contract_wrappers/proxy_wrapper"',
        '"src/contract_wrappers/token_transfer_proxy_wrapper"',
    ],
    [ZeroExJsDocSections.types]: [TYPES_MODULE_PATH],
};

export const typeDocUtils = {
    isType(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Interface ||
               entity.kindString === KindString.Function ||
               entity.kindString === KindString['Type alias'] ||
               entity.kindString === KindString.Variable ||
               entity.kindString === KindString.Enumeration;
    },
    isMethod(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Method;
    },
    isConstructor(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Constructor;
    },
    isProperty(entity: TypeDocNode): boolean {
        return entity.kindString === KindString.Property;
    },
    isPrivateOrProtectedProperty(propertyName: string): boolean {
        return _.startsWith(propertyName, '_');
    },
    isPublicType(typeName: string): boolean {
        return _.includes(constants.public0xjsTypes, typeName);
    },
    getModuleDefinitionBySectionNameIfExists(versionDocObj: TypeDocNode, sectionName: string):
        TypeDocNode|undefined {
        const possibleModulePathNames = sectionNameToPossibleModulePaths[sectionName];
        const modules = versionDocObj.children;
        for (const mod of modules) {
            if (_.includes(possibleModulePathNames, mod.name)) {
                const moduleWithName = mod;
                return moduleWithName;
            }
        }
        return undefined;
    },
    getMenuSubsectionsBySection(docAgnosticFormat?: DocAgnosticFormat): MenuSubsectionsBySection {
        const menuSubsectionsBySection = {} as MenuSubsectionsBySection;
        if (_.isUndefined(docAgnosticFormat)) {
            return menuSubsectionsBySection;
        }

        const docSections = _.keys(ZeroExJsDocSections);
        _.each(docSections, sectionName => {
            const docSection = docAgnosticFormat[sectionName];
            if (_.isUndefined(docSection)) {
                return; // no-op
            }

            if (sectionName === ZeroExJsDocSections.types) {
                const typeNames = _.map(docSection.types, t => t.name);
                menuSubsectionsBySection[sectionName] = typeNames;
            } else {
                const methodNames = _.map(docSection.methods, m => m.name);
                menuSubsectionsBySection[sectionName] = methodNames;
            }
        });
        return menuSubsectionsBySection;
    },
    getFinal0xjsMenu(selectedVersion: string): {[section: string]: string[]} {
        const finalMenu = _.cloneDeep(constants.menu0xjs);
        finalMenu.contracts = _.filter(finalMenu.contracts, (contractName: string) => {
            const versionIntroducedIfExists = constants.menuSubsectionToVersionWhenIntroduced[contractName];
            if (!_.isUndefined(versionIntroducedIfExists)) {
                const existsInSelectedVersion = compareVersions(selectedVersion,
                                                                versionIntroducedIfExists) >= 0;
                return existsInSelectedVersion;
            } else {
                return true;
            }
        });
        return finalMenu;
    },
    convertToDocAgnosticFormat(typeDocJson: TypeDocNode): DocAgnosticFormat {
        const subMenus = _.values(constants.menu0xjs);
        const orderedSectionNames = _.flatten(subMenus);
        const docAgnosticFormat: DocAgnosticFormat = {};
        _.each(orderedSectionNames, sectionName => {
            const packageDefinitionIfExists = typeDocUtils.getModuleDefinitionBySectionNameIfExists(
                typeDocJson, sectionName,
            );
            if (_.isUndefined(packageDefinitionIfExists)) {
                return; // no-op
            }

            // Since the `types.ts` file is the only file that does not export a module/class but
            // instead has each type export itself, we do not need to go down two levels of nesting
            // for it.
            let entities;
            let packageComment = '';
            if (sectionName === ZeroExJsDocSections.types) {
                entities = packageDefinitionIfExists.children;
            } else {
                entities = packageDefinitionIfExists.children[0].children;
                const commentObj = packageDefinitionIfExists.children[0].comment;
                packageComment = !_.isUndefined(commentObj) ? commentObj.shortText : packageComment;
            }

            const docSection = typeDocUtils._convertEntitiesToDocSection(entities, sectionName);
            docSection.comment = packageComment;
            docAgnosticFormat[sectionName] = docSection;
        });
        return docAgnosticFormat;
    },
    _convertEntitiesToDocSection(entities: TypeDocNode[], sectionName: string) {
        const docSection: DocSection = {
            comment: '',
            constructors: [],
            methods: [],
            properties: [],
            types: [],
        };

        let isConstructor;
        _.each(entities, entity => {
            switch (entity.kindString) {
                case KindString.Constructor:
                    isConstructor = true;
                    const constructor = typeDocUtils._convertMethod(entity, isConstructor, sectionName);
                    docSection.constructors.push(constructor);
                    break;

                case KindString.Method:
                    if (entity.flags.isPublic) {
                        isConstructor = false;
                        const method = typeDocUtils._convertMethod(entity, isConstructor, sectionName);
                        docSection.methods.push(method);
                    }
                    break;

                case KindString.Property:
                    if (!typeDocUtils.isPrivateOrProtectedProperty(entity.name)) {
                        const property = typeDocUtils._convertProperty(entity, sectionName);
                        docSection.properties.push(property);
                    }
                    break;

                case KindString.Interface:
                case KindString.Function:
                case KindString.Variable:
                case KindString.Enumeration:
                case KindString['Type alias']:
                    if (typeDocUtils.isPublicType(entity.name)) {
                        const customType = typeDocUtils._convertCustomType(entity, sectionName);
                        docSection.types.push(customType);
                    }
                    break;

                default:
                    throw utils.spawnSwitchErr('kindString', entity.kindString);
            }
        });
        return docSection;
    },
    _convertCustomType(entity: TypeDocNode, sectionName: string): CustomType {
        const typeIfExists = !_.isUndefined(entity.type) ?
                             typeDocUtils._convertType(entity.type, sectionName) :
                             undefined;
        const isConstructor = false;
        const methodIfExists = !_.isUndefined(entity.declaration) ?
            typeDocUtils._convertMethod(entity.declaration, isConstructor, sectionName) :
            undefined;
        const indexSignatureIfExists = !_.isUndefined(entity.indexSignature) ?
            typeDocUtils._convertIndexSignature(entity.indexSignature[0], sectionName) :
            undefined;
        const commentIfExists = !_.isUndefined(entity.comment) && !_.isUndefined(entity.comment.shortText) ?
            entity.comment.shortText :
            undefined;

        const childrenIfExist = !_.isUndefined(entity.children) ?
            _.map(entity.children, (child: TypeDocNode) => {
                const childTypeIfExists = !_.isUndefined(child.type) ?
                    typeDocUtils._convertType(child.type, sectionName) :
                    undefined;
                const c: CustomTypeChild = {
                    name: child.name,
                    type: childTypeIfExists,
                    defaultValue: child.defaultValue,
                };
                return c;
            }) :
            undefined;

        const customType = {
            name: entity.name,
            kindString: entity.kindString,
            type: typeIfExists,
            method: methodIfExists,
            indexSignature: indexSignatureIfExists,
            defaultValue: entity.defaultValue,
            comment: commentIfExists,
            children: childrenIfExist,
        };
        return customType;
    },
    _convertIndexSignature(entity: TypeDocNode, sectionName: string): IndexSignature {
        const key = entity.parameters[0];
        const indexSignature = {
            keyName: key.name,
            keyType: typeDocUtils._convertType(key.type, sectionName),
            valueName: entity.type.name,
        };
        return indexSignature;
    },
    _convertProperty(entity: TypeDocNode, sectionName: string): Property {
        const source = entity.sources[0];
        const commentIfExists = !_.isUndefined(entity.comment) ? entity.comment.shortText : undefined;
        const property = {
            name: entity.name,
            type: typeDocUtils._convertType(entity.type, sectionName),
            source: {
                fileName: source.fileName,
                line: source.line,
            },
            comment: commentIfExists,
        };
        return property;
    },
    _convertMethod(entity: TypeDocNode, isConstructor: boolean, sectionName: string): TypescriptMethod {
        const signature = entity.signatures[0];
        const source = entity.sources[0];
        const hasComment = !_.isUndefined(signature.comment);
        const isStatic = _.isUndefined(entity.flags.isStatic) ? false : entity.flags.isStatic;

        const topLevelInterface = isStatic ? 'ZeroEx.' : 'zeroEx.';
        // HACK: we use the fact that the sectionName is the same as the property name at the top-level
        // of the public interface. In the future, we shouldn't use this hack but rather get it from the JSON.
        let callPath = (sectionName !== ZeroExJsDocSections.zeroEx) ?
            `${topLevelInterface}${sectionName}.` :
            topLevelInterface;
        callPath = isConstructor ? '' : callPath;

        const parameters = _.map(signature.parameters, param => {
            return typeDocUtils._convertParameter(param, sectionName);
        });
        const returnType = typeDocUtils._convertType(signature.type, sectionName);
        const typeParameter = _.isUndefined(signature.typeParameter) ?
                              undefined :
                              typeDocUtils._convertTypeParameter(signature.typeParameter[0], sectionName);

        const method = {
            isConstructor,
            isStatic,
            name: signature.name,
            comment: hasComment ? signature.comment.shortText : undefined,
            returnComment: hasComment && signature.comment.returns ? signature.comment.returns : undefined,
            source: {
                fileName: source.fileName,
                line: source.line,
            },
            callPath,
            parameters,
            returnType,
            typeParameter,
        };
        return method;
    },
    _convertTypeParameter(entity: TypeDocNode, sectionName: string): TypeParameter {
        const type = typeDocUtils._convertType(entity.type, sectionName);
        const parameter = {
            name: entity.name,
            type,
        };
        return parameter;
    },
    _convertParameter(entity: TypeDocNode, sectionName: string): Parameter {
        let comment = '<No comment>';
        if (entity.comment && entity.comment.shortText) {
            comment = entity.comment.shortText;
        } else if (entity.comment && entity.comment.text) {
            comment = entity.comment.text;
        }

        const isOptional = !_.isUndefined(entity.flags.isOptional) ?
            entity.flags.isOptional :
            false;

        const type = typeDocUtils._convertType(entity.type, sectionName);

        const parameter = {
            name: entity.name,
            comment,
            isOptional,
            type,
        };
        return parameter;
    },
    _convertType(entity: TypeDocType, sectionName: string): Type {
        const typeArguments = _.map(entity.typeArguments, typeArgument => {
            return typeDocUtils._convertType(typeArgument, sectionName);
        });
        const types = _.map(entity.types, t => {
            return typeDocUtils._convertType(t, sectionName);
        });

        const isConstructor = false;
        const methodIfExists = !_.isUndefined(entity.declaration) ?
            typeDocUtils._convertMethod(entity.declaration, isConstructor, sectionName) :
            undefined;

        const elementTypeIfExists = !_.isUndefined(entity.elementType) ?
            {
                name: entity.elementType.name,
                typeDocType: entity.elementType.type,
            } :
            undefined;

        const type = {
            name: entity.name,
            value: entity.value,
            typeDocType: entity.type,
            typeArguments,
            elementType: elementTypeIfExists,
            types,
            method: methodIfExists,
        };
        return type;
    },
};
