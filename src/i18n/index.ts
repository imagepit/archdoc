import type { Locale, LocaleMessages } from "./types.js";
import { en } from "./en.js";
import { ja } from "./ja.js";

const MESSAGES: Record<Locale, LocaleMessages> = { en, ja };

/**
 * Get locale messages for the specified locale.
 * @param locale - Locale identifier (defaults to "en")
 * @returns Locale messages object
 */
export function getMessages(locale: Locale = "en"): LocaleMessages {
  return MESSAGES[locale];
}

export type { Locale, LocaleMessages, CategoryKey } from "./types.js";
