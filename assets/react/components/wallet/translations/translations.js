import en from './files/en.json'
import de from './files/de.json'
import es from './files/es.json'
import uk from './files/uk.json'

let translations = {}

const allTranslations = {en, de, es, uk}

export const setTranslations = (languageCode) => {
    if (allTranslations[languageCode]) {
        translations = allTranslations[languageCode]
    } else {
        translations = en
    }
    return translations
}

export const t = (key) => translations[key] || key
