'use client';

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleTheme = () => {
    setIsAnimating(true);
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Button
        isIconOnly
        variant="secondary"
        size="lg"
        onPress={toggleTheme}
        className="transition-transform hover:scale-110 active:scale-95"
      >
        <div
          className={`transition-all duration-500 ${
            isAnimating ? 'scale-0 rotate-180' : 'scale-100 rotate-0'
          }`}
        >
          {theme === 'dark' ? (
            <Icon icon="gravity-ui:moon" className="size-6" />
          ) : (
            <Icon icon="gravity-ui:sun" className="size-6" />
          )}
        </div>
      </Button>
    </div>
  );
}
