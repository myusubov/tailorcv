"use client";

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          isIconOnly
          variant="primary"
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
        >
          <Icon icon="gravity-ui:sun" className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        isIconOnly
        variant="primary"
        size="lg"
        onPress={toggleTheme}
        className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110"
      >
        {theme === 'dark' ? (
          <Icon icon="gravity-ui:moon" className="h-6 w-6" />
        ) : (
          <Icon icon="gravity-ui:sun" className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
