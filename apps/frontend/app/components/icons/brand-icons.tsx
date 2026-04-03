import { Icon } from '@iconify/react';

interface IconProps {
  className?: string;
  size?: number;
}

/** Drop-in replacement for removed lucide-react brand icons */
export function GithubIcon({ className, size }: IconProps) {
  return (
    <Icon
      icon="mdi:github"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    />
  );
}

export function TwitterIcon({ className, size }: IconProps) {
  return (
    <Icon
      icon="mdi:twitter"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    />
  );
}

export function LinkedinIcon({ className, size }: IconProps) {
  return (
    <Icon
      icon="mdi:linkedin"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    />
  );
}
