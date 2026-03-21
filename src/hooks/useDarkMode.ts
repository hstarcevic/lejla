import { useState, useEffect } from 'react';

const THEME_KEY = 'lejla_theme';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');

    // Tell the browser which color scheme we're using so it doesn't
    // apply its own auto-dark-mode (Chrome "Auto Dark Mode for Web Contents")
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', isDark ? 'dark' : 'light');
    }
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1e1b2e' : '#f472b6');
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}
