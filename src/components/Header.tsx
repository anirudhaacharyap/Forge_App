"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LanguageSelector from "@/components/home/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Header() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Hide header if scrolling down and past the threshold of 60px
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { href: "/", labelKey: "header.home" },
    { href: "/materials", labelKey: "header.materials" },
    { href: "/identify", labelKey: "header.identify" },
    { href: "/vendors", labelKey: "header.vendors" },
    { href: "/history", labelKey: "header.history" },
  ];

  return (
    <header className={`bg-[var(--color-surface-card)] fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border-light)] transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="flex justify-between items-center w-full px-6 py-3 max-w-[1440px] mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="material-symbols-outlined text-[var(--color-forge-red)] text-xl scale-110 group-hover:rotate-12 transition-transform duration-300">
            construction
          </span>
          <span className="text-xl font-black tracking-tighter uppercase bg-gradient-to-r from-[var(--color-forge-red)] to-[var(--color-forge-accent)] bg-clip-text text-transparent drop-shadow-sm">
            FORGE
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-xs font-bold uppercase tracking-wider px-2 py-1 transition-colors duration-200 ${
                  isActive
                    ? "text-[var(--color-forge-red)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute left-0 right-0 bottom-0 h-0.5 bg-[var(--color-forge-red)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                {t(link.labelKey)}
              </Link>
            );
          })}
          <div className="pl-6 border-l border-[var(--color-border-light)]">
            <LanguageSelector />
          </div>
        </nav>

        {/* Mobile Hamburger & Lang */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSelector />
          <button
            className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] rounded transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            id="mobile-menu-toggle"
          >
            <span className="material-symbols-outlined">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              className="md:hidden fixed top-0 right-0 bottom-0 w-[250px] bg-[var(--color-surface-card)] z-50 border-l border-[var(--color-border-light)] shadow-2xl flex flex-col"
            >
              <div className="flex justify-end p-4 border-b border-[var(--color-border-light)]">
                <button
                  className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] rounded transition-colors"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="px-4 py-6 space-y-2 flex-grow overflow-y-auto">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block text-sm font-semibold uppercase tracking-wider px-4 py-3 rounded transition-colors ${
                        isActive
                          ? "text-[var(--color-forge-red)] bg-[var(--color-surface-warm)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
                      }`}
                    >
                      {t(link.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
