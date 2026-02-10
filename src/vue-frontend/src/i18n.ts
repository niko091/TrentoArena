import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import it from './locales/it.json'
import de from './locales/de.json'

// Type-define 'en' as the master schema for the resource
type MessageSchema = typeof en


// Helper to detect browser language
function getBrowserType(): 'en' | 'it' | 'de' {
  const lang = navigator.language.split('-')[0];
  if (['en', 'it', 'de'].includes(lang)) {
    return lang as 'en' | 'it' | 'de';
  }
  return 'en';
}

const i18n = createI18n<[MessageSchema], 'en' | 'it' | 'de'>({
  legacy: false, // you must set `false`, to use Composition API
  locale: getBrowserType(), // set locale dynamically
  fallbackLocale: 'en', // set fallback locale
  messages: {
    en,
    it,
    de
  }
})

export default i18n
