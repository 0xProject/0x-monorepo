import * as _ from 'lodash';
import { chinese } from 'ts/translations/chinese';
import { english } from 'ts/translations/english';
import { korean } from 'ts/translations/korean';
import { russian } from 'ts/translations/russian';
import { spanish } from 'ts/translations/spanish';
import { Deco, Key, Language } from 'ts/types';

const languageToTranslations = {
    [Language.English]: english,
    [Language.Spanish]: spanish,
    [Language.Chinese]: chinese,
    [Language.Korean]: korean,
    [Language.Russian]: russian,
};

const languagesWithoutCaps = [Language.Chinese, Language.Korean];

interface Translation {
    [key: string]: string;
}

export class Translate {
    private _selectedLanguage: Language;
    private _translation: Translation;
    constructor(desiredLanguage?: Language) {
        if (!_.isUndefined(desiredLanguage)) {
            this.setLanguage(desiredLanguage);
            return;
        }
        const browserLanguage = (window.navigator as any).userLanguage || window.navigator.language || 'en-US';
        let language = Language.English;
        if (_.includes(browserLanguage, 'es-')) {
            language = Language.Spanish;
        } else if (_.includes(browserLanguage, 'zh-')) {
            language = Language.Chinese;
        } else if (_.includes(browserLanguage, 'ko-')) {
            language = Language.Korean;
        } else if (_.includes(browserLanguage, 'ru-')) {
            language = Language.Russian;
        }
        this.setLanguage(language);
    }
    public getLanguage() {
        return this._selectedLanguage;
    }
    public setLanguage(language: Language) {
        const isLanguageSupported = !_.isUndefined(languageToTranslations[language]);
        if (!isLanguageSupported) {
            throw new Error(`${language} not supported`);
        }
        this._selectedLanguage = language;
        this._translation = languageToTranslations[language];
    }
    public get(key: Key, decoration?: Deco) {
        let text = this._translation[key];
        if (!_.isUndefined(decoration) && !_.includes(languagesWithoutCaps, this._selectedLanguage)) {
            switch (decoration) {
                case Deco.Cap:
                    text = this._capitalize(text);
                    break;

                case Deco.Upper:
                    text = text.toUpperCase();
                    break;

                case Deco.CapWords:
                    const words = text.split(' ');
                    const capitalizedWords = _.map(words, w => this._capitalize(w));
                    text = capitalizedWords.join(' ');
                    break;

                default:
                    throw new Error(`Unrecognized decoration: ${decoration}`);
            }
        }
        return text;
    }
    private _capitalize(text: string) {
        return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
    }
}
