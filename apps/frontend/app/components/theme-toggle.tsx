"use client";

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();



  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        isIconOnly
        variant="secondary"
        size="lg"
        onPress={toggleTheme}
      >
        {theme === 'dark' ? (
          <Icon icon="gravity-ui:moon" className="size-6" />
        ) : (
          <Icon icon="gravity-ui:sun" className="size-6" />
        )}
      </Button>
    </div>
  );
}
