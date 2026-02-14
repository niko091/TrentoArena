import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import it from "./locales/it.json";
import de from "./locales/de.json";

type MessageSchema = typeof en;

function getBrowserType(): "en" | "it" | "de" {
  const lang = navigator.language.split("-")[0];
  if (["en", "it", "de"].includes(lang)) {
    return lang as "en" | "it" | "de";
  }
  return "en";
}

const i18n = createI18n<[MessageSchema], "en" | "it" | "de">({
  legacy: false,
  locale: getBrowserType(),
  fallbackLocale: "en",
  messages: {
    en,
    it,
    de,
  },
});

export default i18n;
