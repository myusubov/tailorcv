'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { GithubIcon, TwitterIcon, LinkedinIcon } from '../icons/brand-icons';

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Roadmap', href: '/roadmap' },
      { name: 'Changelog', href: '/changelog' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { name: 'Blog', href: '/blog' },
      { name: 'Documentation', href: '/docs' },
      { name: 'Templates', href: '/templates' },
      { name: 'API', href: '/api' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
    ],
  },
};

const socialLinks = [
  { name: 'Twitter', icon: TwitterIcon, href: 'https://twitter.com/tailorcv' },
  { name: 'GitHub', icon: GithubIcon, href: 'https://github.com/tailorcv' },
  {
    name: 'LinkedIn',
    icon: LinkedinIcon,
    href: 'https://linkedin.com/company/tailorcv',
  },
];

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: { name: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-landing-text mb-4 text-sm font-semibold tracking-wider uppercase">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={'#'}
              className="text-landing-text-muted hover:text-landing-text text-sm transition-colors"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-landing-border bg-landing-bg relative border-t">
      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 mb-8 md:col-span-4 lg:col-span-1 lg:mb-0">
            <Link href="/" className="mb-4 inline-block">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold"
              >
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  TailorCV
                </span>
              </motion.div>
            </Link>
            <p className="text-landing-text-muted mb-6 max-w-xs text-sm">
              Tailor your resume for any job in 30 seconds. Built specifically
              for developers.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-landing-border bg-surface text-landing-text-muted hover:border-landing-border-muted hover:text-landing-text flex h-9 w-9 items-center justify-center rounded-lg border transition-all"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <FooterLinkColumn {...footerLinks.product} />
          <FooterLinkColumn {...footerLinks.resources} />
          <FooterLinkColumn {...footerLinks.company} />

          {/* Newsletter / Extra column */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-landing-text mb-4 text-sm font-semibold tracking-wider uppercase">
              Stay Updated
            </h4>
            <p className="text-landing-text-muted mb-4 text-sm">
              Get the latest updates on new features and tips.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="border-landing-border bg-surface text-landing-text placeholder:text-landing-text-muted flex-1 rounded-lg border px-3 py-2 text-sm transition-colors focus:border-indigo-500/50 focus:outline-none"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Subscribe
              </motion.button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-landing-border border-t">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Copyright */}
            <p className="text-landing-text-muted text-sm">
              © {new Date().getFullYear()} TailorCV. All rights reserved.
            </p>

            {/* Built with love */}
            <p className="text-landing-text-muted flex items-center gap-1.5 text-sm">
              Built with
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  type: 'tween',
                  duration: 1,
                  repeat: 9999,
                  repeatDelay: 2,
                }}
              >
                <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
              </motion.span>
              for developers
            </p>

            {/* Extra links */}
            <div className="text-landing-text-muted flex items-center gap-6 text-sm">
              <Link
                href="#"
                className="hover:text-landing-text transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="hover:text-landing-text transition-colors"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="hover:text-landing-text transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
