window.translations = {
  es: {},
  en: {}
};

const availableLanguages = ['es', 'en'];

async function loadTranslationFile(lang) {
  try {
    const response = await fetch(`./locales/${lang}.json`);
    return await response.json();
  } catch (error) {
    console.error(`[BIT-Smartphone] Failed to load ${lang} translations:`, error);
    return null;
  }
}

async function loadAllTranslations() {
  try {
    for (const lang of availableLanguages) {
      const data = await loadTranslationFile(lang);
      if (data) {
        window.translations[lang] = data;
      }
    }
    return window.translations;
  } catch (error) {
    console.error('[BIT-Smartphone] Error loading translations:', error);
    return window.translations;
  }
}

loadAllTranslations().then(() => {
  window.dispatchEvent(new CustomEvent('translationsLoaded'));
});
