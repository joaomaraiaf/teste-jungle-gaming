import desktop from 'lighthouse/core/config/desktop-config.js';
export const pages = { inicio: '/', detalhe: '/market/nft-001' };
export const targets = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 };
const settings = { onlyCategories: Object.keys(targets), locale: 'pt-BR', maxWaitForLoad: 45000 };
export const profiles = {
  mobile: { extends: 'lighthouse:default', settings },
  desktop: { ...desktop, settings: { ...desktop.settings, ...settings } },
};
