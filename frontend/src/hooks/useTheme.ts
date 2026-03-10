import { useState, useEffect } from 'react';
import { obtenerConfiguracion, actualizarConfiguracion } from '../services/api';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage not available
  }
  return 'dark';
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isInitializing, setIsInitializing] = useState(true);

  // Apply theme class and save temporarily to local storage
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage not available
    }
  }, [theme]);

  // Read backend configuration on load
  useEffect(() => {
    obtenerConfiguracion()
      .then(config => {
        if (config.tema) {
          setTheme(config.tema);
        }
      })
      .catch(err => {
        console.error('Error fetching theme configuration:', err);
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      
      // Sync choice with backend asynchronously
      actualizarConfiguracion({ tema: newTheme }).catch(err => {
        console.error('Error saving theme configuration to backend:', err);
      });
      
      return newTheme;
    });
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isInitializing
  };
}
