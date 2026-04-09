"use client";

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, GraduationCap, FileText, Sparkles } from 'lucide-react';

const floatingItems = [
  { icon: BookOpen, label: 'Books', color: 'from-blue-500 to-cyan-500', x: -280, y: -120, delay: 0 },
  { icon: GraduationCap, label: 'Courses', color: 'from-violet-500 to-purple-500', x: 260, y: -80, delay: 0.3 },
  { icon: FileText, label: 'Papers', color: 'from-amber-500 to-orange-500', x: -220, y: 100, delay: 0.6 },
  { icon: Sparkles, label: 'More', color: 'from-emerald-500 to-teal-500', x: 240, y: 120, delay: 0.9 },
];

export default function Hero() {
  return (
    <section className="relative min-h-[92vh] sm:min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-14 sm:pb-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-linear-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse-glow" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Top gradient fade */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-background to-transparent" />
      </div>

      {/* Floating icons - hidden on mobile */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        {floatingItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 + item.delay, type: 'spring', stiffness: 100 }}
            className="absolute top-1/2 left-1/2"
            style={{ marginLeft: item.x, marginTop: item.y }}
          >
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
              transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-14 h-14 bg-linear-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-muted/50 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mb-8 group"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Open Source & Free Forever
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          Knowledge should be{' '}
          <span className="relative">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #3b82f6)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 4s ease infinite',
              }}
            >
              free
            </span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
              className="absolute -bottom-1 left-0 right-0 h-1 bg-linear-to-r from-blue-500 to-violet-500 rounded-full origin-left"
            />
          </span>
          {' '}for everyone
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          Access thousands of books, courses, exam papers, and educational resources — 
          completely free. Built by the community, for the community.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <motion.a
            href="browse"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-base shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:bg-blue-700 transition-all overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Browse Library
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            {/* Shimmer effect */}
            <span className="absolute inset-0 overflow-hidden rounded-2xl">
              <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </span>
          </motion.a>

          <motion.a
            href="register"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-border font-semibold text-base hover:bg-muted transition-all"
          >
            Join for Free
          </motion.a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          className="flex flex-wrap justify-center gap-8 sm:gap-12 mt-12 pt-6 border-t border-border/50"
        >
          {[
            { value: '10K+', label: 'Books' },
            { value: '500+', label: 'Courses' },
            { value: '2K+', label: 'Papers' },
            { value: '50K+', label: 'Users' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 + i * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs font-medium">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
