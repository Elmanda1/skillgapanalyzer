export const translations = {
  'layout.toggleTheme': 'Ganti mode terang/gelap',
};

export function t(key) {
  return translations[key] || key;
}

export default { t, translations };
