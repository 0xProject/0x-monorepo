import * as _ from 'lodash';
import { english } from 'ts/translations/english';
import { Deco, Key, Language } from 'ts/types';

const languageToTranslations = {
    [Language.English]: english,
};

interface Translation {
    [key: string]: string;
}

export class Translate {
    private _selectedLanguage: Language;
    private _translation: Translation;
    constructor() {
        this.setLanguage(Language.English);
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
        if (!_.isUndefined(decoration)) {
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
