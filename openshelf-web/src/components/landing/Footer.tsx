"use client";

import { BookOpen, Heart } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Browse Library', href: '#browse' },
    { label: 'Categories', href: '#' },
    { label: 'New Additions', href: '#' },
    { label: 'Popular', href: '#' },
  ],
  Community: [
    { label: 'Contribute', href: '#' },
    { label: 'Discussions', href: '#' },
    { label: 'Discord', href: '#' },
    { label: 'Twitter', href: '#' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'API', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Changelog', href: '#' },
  ],
  Legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'License', href: '#' },
    { label: 'DMCA', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer id="about" className="scroll-mt-24 sm:scroll-mt-28 border-t border-border bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#top" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Open<span className="text-blue-600">Shelf</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A free, open-source global library for everyone. Knowledge without boundaries.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} OpenShelf. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> by the community
          </p>
        </div>
      </div>
    </footer>
  );
}
