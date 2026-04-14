import {useEffect, useState} from 'react'
import {setDateTimeLocale} from '../utils/formatDateTime.js'
import {I18nContext} from './I18nContext.js'
import enRaw from './locales/en.xliff?raw'
import mkRaw from './locales/mk.xliff?raw'
import {parseXliff} from './parseXliff.js'

const STORAGE_KEY = 'neighborhelp.language'

const localeDefinitions = {
    en: {
        code: 'en',
        dateLocale: 'en-US',
        flag: '🇺🇸',
        label: 'English',
        nativeLabel: 'English',
        messages: parseXliff(enRaw),
    },
    mk: {
        code: 'mk',
        dateLocale: 'mk-MK',
        flag: '🇲🇰',
        label: 'Macedonian',
        nativeLabel: 'Македонски',
        messages: parseXliff(mkRaw),
    },
}

function interpolate(template, values = {}) {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
        const value = values[key]
        return value == null ? `{${key}}` : String(value)
    })
}

function resolveInitialLanguage() {
    const storedLanguage = window.localStorage.getItem(STORAGE_KEY)
    return localeDefinitions[storedLanguage] ? storedLanguage : 'en'
}

function translate(language, key, values = {}) {
    const activeMessages = localeDefinitions[language]?.messages ?? localeDefinitions.en.messages
    const template = activeMessages[key] ?? localeDefinitions.en.messages[key] ?? key
    return interpolate(template, values)
}

export function I18nProvider({children}) {
    const [language, setLanguage] = useState(resolveInitialLanguage)

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, language)
        document.documentElement.lang = language
        setDateTimeLocale(
            localeDefinitions[language].dateLocale,
            translate(language, 'common.noDate'),
        )
    }, [language])

    const value = {
        language,
        languages: Object.values(localeDefinitions).map(({code, flag, label, nativeLabel}) => ({
            code,
            flag,
            label,
            nativeLabel,
        })),
        setLanguage,
        t: (key, values) => translate(language, key, values),
    }

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
