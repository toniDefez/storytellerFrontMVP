import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import es from './locales/es.json'
import en from './locales/en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'es',
    compatibilityJSON: 'v4',
    // Español salvo que el usuario elija otro idioma en Ajustes: el idioma del
    // navegador del móvil colaba un menú en inglés en una app en español.
    detection: {
      order: ['localStorage'],
      // Clave nueva: la anterior guardaba el idioma del navegador como si lo
      // hubiera elegido el usuario.
      lookupLocalStorage: 'storyteller-lang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
