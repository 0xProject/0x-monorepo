import * as _ from 'lodash';
import { Deco, Key, Language } from 'ts/types';

import * as chinese from '../../translations/chinese.json';
import * as english from '../../translations/english.json';
import * as korean from '../../translations/korean.json';
import * as russian from '../../translations/russian.json';
import * as spanish from '../../translations/spanish.json';

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
    public getLanguage(): Language {
        return this._selectedLanguage;
    }
    public setLanguage(language: Language): void {
        const isLanguageSupported = !_.isUndefined(languageToTranslations[language]);
        if (!isLanguageSupported) {
            throw new Error(`${language} not supported`);
        }
        this._selectedLanguage = language;
        this._translation = languageToTranslations[language];
    }
    public get(key: Key, decoration?: Deco): string {
        let text = this._translation[key];
        // if a translation does not exist for a certain language, fallback to english
        // if it still doesn't exist in english, throw an error
        if (_.isUndefined(text)) {
            const englishTranslation: Translation = languageToTranslations[Language.English];
            const englishText = englishTranslation[key];
            if (!_.isUndefined(englishText)) {
                text = englishText;
            } else {
                throw new Error(
                    `Translation key not available in ${this._selectedLanguage} or ${Language.English}: ${key}`,
                );
            }
        }
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
                    const capitalizedWords = _.map(words, (w: string, i: number) => {
                        if (w.length === 1) {
                            return w;
                        }
                        return this._capitalize(w);
                    });
                    text = capitalizedWords.join(' ');
                    break;

                default:
                    throw new Error(`Unrecognized decoration: ${decoration}`);
            }
        }
        return text;
    }
    private _capitalize(text: string): string {
        return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
    }
}
