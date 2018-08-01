import { MenuSubsectionsBySection } from '@0xproject/react-shared';
import compareVersions = require('compare-versions');
import * as _ from 'lodash';

import {
    ContractsByVersionByNetworkId,
    DocAgnosticFormat,
    DocsInfoConfig,
    DocsInfoTypeConfigs,
    DocsMenu,
    DoxityDocObj,
    SectionNameToMarkdownByVersion,
    SectionsMap,
    SupportedDocJson,
    TypeDefinitionByName,
    GeneratedDocJson,
} from './types';
import { doxityUtils } from './utils/doxity_utils';
import { typeDocUtils } from './utils/typedoc_utils';

export class DocsInfo {
    public id: string;
    public type: SupportedDocJson;
    public displayName: string;
    public packageUrl: string;
    public menu: DocsMenu;
    public sections: SectionsMap;
    public sectionNameToMarkdownByVersion: SectionNameToMarkdownByVersion;
    public contractsByVersionByNetworkId?: ContractsByVersionByNetworkId;
    public typeConfigs: DocsInfoTypeConfigs;
    private readonly _docsInfo: DocsInfoConfig;
    constructor(config: DocsInfoConfig) {
        this.id = config.id;
        this.type = config.type;
        this.menu = config.menu;
        this.displayName = config.displayName;
        this.packageUrl = config.packageUrl;
        this.sections = config.sections;
        this.sectionNameToMarkdownByVersion = config.sectionNameToMarkdownByVersion;
        this.contractsByVersionByNetworkId = config.contractsByVersionByNetworkId;
        this.typeConfigs = config.typeConfigs;
        this._docsInfo = config;
    }
    public getMenu(selectedVersion?: string): { [section: string]: string[] } {
        return this._docsInfo.menu;
    }
    public getMenuSubsectionsBySection(docAgnosticFormat?: DocAgnosticFormat): MenuSubsectionsBySection {
        const menuSubsectionsBySection = {} as MenuSubsectionsBySection;
        if (_.isUndefined(docAgnosticFormat)) {
            return menuSubsectionsBySection;
        }

        const docSections = _.keys(this.sections);
        _.each(docSections, sectionName => {
            const docSection = docAgnosticFormat[sectionName];
            if (_.isUndefined(docSection)) {
                return; // no-op
            }

            if (!_.isUndefined(this.sections.types) && sectionName === this.sections.types) {
                const sortedTypesNames = _.sortBy(docSection.types, 'name');
                const typeNames = _.map(sortedTypesNames, t => t.name);
                menuSubsectionsBySection[sectionName] = typeNames;
            } else {
                let eventNames: string[] = [];
                if (!_.isUndefined(docSection.events)) {
                    const sortedEventNames = _.sortBy(docSection.events, 'name');
                    eventNames = _.map(sortedEventNames, m => m.name);
                }
                const propertiesSortedByName = _.sortBy(docSection.properties, 'name');
                const propertyNames = _.map(propertiesSortedByName, m => m.name);
                const methodsSortedByName = _.sortBy(docSection.methods, 'name');
                const methodNames = _.map(methodsSortedByName, m => m.name);
                const sortedFunctionNames = _.sortBy(docSection.functions, 'name');
                const functionNames = _.map(sortedFunctionNames, m => m.name);
                menuSubsectionsBySection[sectionName] = [
                    ...eventNames,
                    ...propertyNames,
                    ...functionNames,
                    ...methodNames,
                ];
            }
        });
        return menuSubsectionsBySection;
    }
    public getTypeDefinitionsByName(docAgnosticFormat: DocAgnosticFormat): { [name: string]: TypeDefinitionByName } {
        if (_.isUndefined(this.sections.types)) {
            return {};
        }

        const typeDocSection = docAgnosticFormat[this.sections.types];
        const typeDefinitionByName = _.keyBy(typeDocSection.types, 'name') as any;
        return typeDefinitionByName;
    }
    public convertToDocAgnosticFormat(docObj: DoxityDocObj | GeneratedDocJson): DocAgnosticFormat {
        if (this.type === SupportedDocJson.Doxity) {
            return doxityUtils.convertToDocAgnosticFormat(docObj as DoxityDocObj);
        } else {
            return typeDocUtils.convertToDocAgnosticFormat(docObj as GeneratedDocJson, this);
        }
    }
}
