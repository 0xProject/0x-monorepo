import compareVersions = require('compare-versions');
import * as _ from 'lodash';
import {DocsInfoConfig, DocsMenu, SectionsMap} from 'ts/types';

export class DocsInfo {
    public packageName: string;
    public packageUrl: string;
    public websitePath: string;
    public docsJsonRoot: string;
    public menu: DocsMenu;
    public sections: SectionsMap;
    public sectionNameToMarkdown: {[sectionName: string]: string};
    private docsInfo: DocsInfoConfig;
    constructor(config: DocsInfoConfig) {
        this.packageName = config.packageName;
        this.packageUrl = config.packageUrl;
        this.websitePath = config.websitePath;
        this.docsJsonRoot = config.docsJsonRoot;
        this.sections = config.sections;
        this.sectionNameToMarkdown = config.sectionNameToMarkdown;
        this.docsInfo = config;
    }
    public isPublicType(typeName: string): boolean {
        if (_.isUndefined(this.docsInfo.publicTypes)) {
            return false;
        }
        const isPublic = _.includes(this.docsInfo.publicTypes, typeName);
        return isPublic;
    }
    public getModulePathsIfExists(sectionName: string): string[] {
        const modulePathsIfExists = this.docsInfo.sectionNameToModulePath[sectionName];
        return modulePathsIfExists;
    }
    public getMenu(selectedVersion?: string): {[section: string]: string[]} {
        if (_.isUndefined(selectedVersion) || _.isUndefined(this.docsInfo.menuSubsectionToVersionWhenIntroduced)) {
            return this.docsInfo.menu;
        }

        const finalMenu = _.cloneDeep(this.docsInfo.menu);
        finalMenu.contracts = _.filter(finalMenu.contracts, (contractName: string) => {
            const versionIntroducedIfExists = this.docsInfo.menuSubsectionToVersionWhenIntroduced[contractName];
            if (!_.isUndefined(versionIntroducedIfExists)) {
                const existsInSelectedVersion = compareVersions(selectedVersion,
                                                                versionIntroducedIfExists) >= 0;
                return existsInSelectedVersion;
            } else {
                return true;
            }
        });
        return finalMenu;
    }
}
