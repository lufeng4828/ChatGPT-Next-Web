import cn from "./cn";
import en from "./en";
import pt from "./pt";
import tw from "./tw";
import id from "./id";
import fr from "./fr";
import es from "./es";
import it from "./it";
import tr from "./tr";
import jp from "./jp";
import de from "./de";
import vi from "./vi";
import ru from "./ru";
import no from "./no";
import cs from "./cs";
import ko from "./ko";
import ar from "./ar";
import bn from "./bn";
import { merge } from "../utils/merge";
import moment from "moment";

import "moment/locale/zh-cn"; // 简体中文
import "moment/locale/en-gb"; // 英文
import "moment/locale/pt"; // 葡萄牙语
import "moment/locale/zh-tw"; // 繁体中文
import "moment/locale/ja"; // 日语
import "moment/locale/ko"; // 韩语
import "moment/locale/id"; // 印尼语
import "moment/locale/fr"; // 法语
import "moment/locale/es"; // 西班牙语
import "moment/locale/it"; // 意大利语
import "moment/locale/tr"; // 土耳其语
import "moment/locale/de"; // 德语
import "moment/locale/vi"; // 越南语
import "moment/locale/ru"; // 俄语
import "moment/locale/cs"; // 捷克语
import "moment/locale/nn"; // 挪威尼诺斯克语
import "moment/locale/ar"; // 阿拉伯语
import "moment/locale/bn"; // 孟加拉语

import type { LocaleType } from "./cn";
export type { LocaleType, PartialLocaleType } from "./cn";

const ALL_LANGS = {
  cn,
  en,
  tw,
  pt,
  jp,
  ko,
  id,
  fr,
  es,
  it,
  tr,
  de,
  vi,
  ru,
  cs,
  no,
  ar,
  bn,
};

export type Lang = keyof typeof ALL_LANGS;

export const AllLangs = Object.keys(ALL_LANGS) as Lang[];

export const ALL_LANG_OPTIONS: Record<Lang, string> = {
  cn: "简体中文",
  en: "English",
  pt: "Português",
  tw: "繁體中文",
  jp: "日本語",
  ko: "한국어",
  id: "Indonesia",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  tr: "Türkçe",
  de: "Deutsch",
  vi: "Tiếng Việt",
  ru: "Русский",
  cs: "Čeština",
  no: "Nynorsk",
  ar: "العربية",
  bn: "বাংলা",
};

const LANG_KEY = "lang";
const DEFAULT_LANG = "en";

const fallbackLang = en;
const targetLang = ALL_LANGS[getLang()] as LocaleType;

// if target lang missing some fields, it will use fallback lang string
merge(fallbackLang, targetLang);

export default fallbackLang as LocaleType;

function getItem(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function getLanguage() {
  try {
    return navigator.language.toLowerCase();
  } catch {
    return DEFAULT_LANG;
  }
}

export function getLang(): Lang {
  const savedLang = getItem(LANG_KEY);

  if (AllLangs.includes((savedLang ?? "") as Lang)) {
    return savedLang as Lang;
  }

  const lang = getLanguage();

  for (const option of AllLangs) {
    if (lang.includes(option)) {
      return option;
    }
  }

  return DEFAULT_LANG;
}

export const MOMENT_LANG_MAPPING = {
  cn: "zh-cn",
  en: "en-gb",
  pt: "pt",
  tw: "zh-tw",
  jp: "ja",
  ko: "ko",
  id: "id",
  fr: "fr",
  es: "es",
  it: "it",
  tr: "tr",
  de: "de",
  vi: "vi",
  ru: "ru",
  cs: "cs",
  no: "nn",
  ar: "ar",
  bn: "bn",
};

export function timeAgo(timeStr: string) {
  moment.locale(MOMENT_LANG_MAPPING[getLang()]);
  const time = moment(timeStr, "YYYY/MM/DD HH:mm:ss");
  const timeAgo = time.fromNow();
  return timeAgo;
}

export function changeLang(lang: Lang) {
  setItem(LANG_KEY, lang);
  location.reload();
}

export function getISOLang() {
  const isoLangString: Record<string, string> = {
    cn: "zh-Hans",
    tw: "zh-Hant",
  };

  const lang = getLang();
  return isoLangString[lang] ?? lang;
}
