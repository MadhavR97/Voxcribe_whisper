export type Language = {
  code: string
  label: string
  native: string
  flag: string
  supported: boolean
  note?: string
}

/**
 * Whisper-validated language list
 * Model: ggml-base.bin / ggml-small.bin
 * Rule:
 *  - supported=true  → force -l <code>
 *  - supported=false → show "Not supported yet"
 */

export const LANGUAGES: Language[] = [
  // ─── FULLY SUPPORTED ───────────────────────────

  { code: "en", label: "English", native: "English", flag: "🇺🇸", supported: true },
  { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳", supported: true },
  { code: "es", label: "Spanish", native: "Español", flag: "🇪🇸", supported: true },
  { code: "fr", label: "French", native: "Français", flag: "🇫🇷", supported: true },
  { code: "de", label: "German", native: "Deutsch", flag: "🇩🇪", supported: true },
  { code: "it", label: "Italian", native: "Italiano", flag: "🇮🇹", supported: true },
  { code: "pt", label: "Portuguese", native: "Português", flag: "🇵🇹", supported: true },
  { code: "ru", label: "Russian", native: "Русский", flag: "🇷🇺", supported: true },
  { code: "bn", label: "Bengali", native: "বাংলা", flag: "🇧🇩", supported: true },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦", supported: true },
  { code: "ur", label: "Urdu", native: "اردو", flag: "🇵🇰", supported: true },
  { code: "tr", label: "Turkish", native: "Türkçe", flag: "🇹🇷", supported: true },
  { code: "th", label: "Thai", native: "ไทย", flag: "🇹🇭", supported: true },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳", supported: true },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩", supported: true },
  { code: "ja", label: "Japanese", native: "日本語", flag: "🇯🇵", supported: true },
  { code: "ko", label: "Korean", native: "한국어", flag: "🇰🇷", supported: true },
  { code: "zh", label: "Chinese", native: "中文", flag: "🇨🇳", supported: true },

  // ─── PARTIAL / BETA ────────────────────────────

  {
    code: "ta",
    label: "Tamil",
    native: "தமிழ்",
    flag: "🇮🇳",
    supported: false,
    note: "Beta – inconsistent accuracy"
  },
  {
    code: "te",
    label: "Telugu",
    native: "తెలుగు",
    flag: "🇮🇳",
    supported: false,
    note: "Beta – inconsistent accuracy"
  },
  {
    code: "ml",
    label: "Malayalam",
    native: "മലയാളം",
    flag: "🇮🇳",
    supported: false,
    note: "Beta – inconsistent accuracy"
  },
  {
    code: "mr",
    label: "Marathi",
    native: "मराठी",
    flag: "🇮🇳",
    supported: false,
    note: "Beta – inconsistent accuracy"
  },

  // ─── NOT SUPPORTED YET ─────────────────────────

  {
    code: "pa",
    label: "Punjabi",
    native: "ਪੰਜਾਬੀ",
    flag: "🇮🇳",
    supported: false,
    note: "Often mis-detected as Hindi or Urdu"
  },
  {
    code: "gu",
    label: "Gujarati",
    native: "ગુજરાતી",
    flag: "🇮🇳",
    supported: false,
    note: "Script recognition unreliable"
  },
  {
    code: "ne",
    label: "Nepali",
    native: "नेपाली",
    flag: "🇳🇵",
    supported: false,
    note: "Frequently mis-detected as Hindi"
  },
  {
    code: "si",
    label: "Sinhala",
    native: "සිංහල",
    flag: "🇱🇰",
    supported: false,
    note: "Very low transcription accuracy"
  },
  {
    code: "or",
    label: "Odia",
    native: "ଓଡ଼ିଆ",
    flag: "🇮🇳",
    supported: false,
    note: "Tokenization issues"
  },
]
