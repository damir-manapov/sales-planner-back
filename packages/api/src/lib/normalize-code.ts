/**
 * Transliteration map for Cyrillic to Latin characters
 */
const cyrillicToLatinMap: Record<string, string> = {
  а: 'a',
  А: 'A',
  б: 'b',
  Б: 'B',
  в: 'v',
  В: 'V',
  г: 'g',
  Г: 'G',
  д: 'd',
  Д: 'D',
  е: 'e',
  Е: 'E',
  ё: 'yo',
  Ё: 'Yo',
  ж: 'zh',
  Ж: 'Zh',
  з: 'z',
  З: 'Z',
  и: 'i',
  И: 'I',
  й: 'y',
  Й: 'Y',
  к: 'k',
  К: 'K',
  л: 'l',
  Л: 'L',
  м: 'm',
  М: 'M',
  н: 'n',
  Н: 'N',
  о: 'o',
  О: 'O',
  п: 'p',
  П: 'P',
  р: 'r',
  Р: 'R',
  с: 's',
  С: 'S',
  т: 't',
  Т: 'T',
  у: 'u',
  У: 'U',
  ф: 'f',
  Ф: 'F',
  х: 'h',
  Х: 'H',
  ц: 'ts',
  Ц: 'Ts',
  ч: 'ch',
  Ч: 'Ch',
  ш: 'sh',
  Ш: 'Sh',
  щ: 'shch',
  Щ: 'Shch',
  ъ: '',
  Ъ: '',
  ы: 'y',
  Ы: 'Y',
  ь: '',
  Ь: '',
  э: 'e',
  Э: 'E',
  ю: 'yu',
  Ю: 'Yu',
  я: 'ya',
  Я: 'Ya',
};

/**
 * Transliterates Cyrillic characters to Latin while preserving case
 */
function transliterate(text: string): string {
  return text
    .split('')
    .map((char) => cyrillicToLatinMap[char] ?? char)
    .join('');
}

/**
 * Splits text into words by separators and case changes
 * Handles:
 * - Explicit separators (underscores, hyphens)
 * - Case changes (camelCase, PascalCase boundaries)
 * - Number-to-letter boundaries
 */
export function splitIntoWords(text: string): string[] {
  if (text.length === 0) return [];

  // Split by explicit separators and case changes
  // This regex splits on:
  // - Underscores and hyphens: [_-]+
  // - Boundaries between lowercase and uppercase letters: (?<=[a-z])(?=[A-Z])
  // - Boundaries before uppercase letters that are followed by lowercase letters: (?=[A-Z][a-z])
  // - Boundaries between numbers and uppercase letters: (?<=[0-9])(?=[A-Z])
  const words = text
    .split(/[_-]+|(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])|(?<=[0-9])(?=[A-Z])/)
    .filter(Boolean);

  return words;
}

/**
 * Converts string to camelCase
 */
function toCamelCase(text: string): string {
  const words = splitIntoWords(text);

  if (words.length === 0) return '';

  // First word lowercase, rest capitalized
  return words
    .map((word, i) =>
      i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('');
}

/**
 * Normalizes code: removes all spaces, transliterates Cyrillic to Latin, and converts to camelCase
 * Used for marketplace codes, brand codes, and other identifiers
 * Examples:
 * - "Товар-123" -> "tovar123"
 * - "SKU_CODE" -> "skuCode"
 * - "My SKU 01" -> "mySku01"
 * - " code with spaces " -> "codeWithSpaces"
 */
export function normalizeCode(code: string): string {
  if (!code) return code;

  // Replace spaces with hyphens (preserving word boundaries), then transliterate
  const transliterated = transliterate(code.replace(/\s+/g, '-'));

  return toCamelCase(transliterated);
}

/**
 * Normalizes SKU code: removes all spaces and transliterates Cyrillic to Latin, preserving case and other separators
 * Examples:
 * - "Товар-123" -> "Tovar-123"
 * - "SKU_CODE" -> "SKU_CODE"
 * - "My SKU 01" -> "MySKU01"
 * - " SKU-001 " -> "SKU-001"
 */
export function normalizeSkuCode(code: string): string {
  if (!code) return code;

  // Remove all spaces, then transliterate Cyrillic to Latin, preserve case
  return transliterate(code.replace(/\s+/g, ''));
}
