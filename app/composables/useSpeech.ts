/**
 * Web Speech API text-to-speech for Impact portal.
 * Prefers fil-PH, falls back to en-PH / en.
 */
export function useSpeech() {
  const speaking = ref(false)
  const supported = computed(() => import.meta.client && typeof window !== 'undefined' && 'speechSynthesis' in window)

  function pickVoice(lang: string): SpeechSynthesisVoice | null {
    if (!supported.value) return null
    const voices = window.speechSynthesis.getVoices()
    const preferred = lang.startsWith('tl') || lang.startsWith('fil')
      ? ['fil-PH', 'fil', 'tl', 'en-PH', 'en']
      : ['en-PH', 'en-US', 'en']
    for (const code of preferred) {
      const match = voices.find(v => v.lang.toLowerCase().startsWith(code.toLowerCase()))
      if (match) return match
    }
    return voices[0] ?? null
  }

  function speak(text: string, locale = 'tl') {
    if (!supported.value || !text.trim()) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = locale.startsWith('en') ? 'en-PH' : 'fil-PH'
    const voice = pickVoice(utter.lang)
    if (voice) utter.voice = voice
    utter.onstart = () => {
      speaking.value = true
    }
    utter.onend = () => {
      speaking.value = false
    }
    utter.onerror = () => {
      speaking.value = false
    }
    window.speechSynthesis.speak(utter)
  }

  function stop() {
    if (!supported.value) return
    window.speechSynthesis.cancel()
    speaking.value = false
  }

  function toggle(text: string, locale = 'tl') {
    if (speaking.value) stop()
    else speak(text, locale)
  }

  return { speaking, supported, speak, stop, toggle }
}
