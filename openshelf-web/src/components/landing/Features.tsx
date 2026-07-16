'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Search, Download, Users, Shield, Zap, Globe, BookMarked, Heart, Code } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Smart Search',
    description:
      'Find exactly what you need with our powerful search engine. Filter by subject, author, year, or format.',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    iconColor: '#3b82f6',
  },
  {
    icon: Download,
    title: 'Instant Access',
    description:
      'Read online or download for offline use. Support for PDF, EPUB, and more formats.',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-500/10',
    iconColor: '#8b5cf6',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description:
      'Built by contributors worldwide. Anyone can add resources, review content, and improve the library.',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    iconColor: '#f59e0b',
  },
  {
    icon: Shield,
    title: 'Quality Assured',
    description:
      'Every resource is reviewed and verified by our community moderators for accuracy and relevance.',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    iconColor: '#10b981',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description:
      'Optimized CDN delivery ensures fast loading times no matter where you are in the world.',
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-yellow-500/10',
    iconColor: '#eab308',
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Resources available in 50+ languages. Breaking language barriers in education.',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500/10',
    iconColor: '#ec4899',
  },
  {
    icon: BookMarked,
    title: 'Personal Library',
    description:
      'Save your favorites, create reading lists, and track your learning progress across devices.',
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-500/10',
    iconColor: '#6366f1',
  },
  {
    icon: Heart,
    title: 'Forever Free',
    description: 'No subscriptions, no paywalls, no ads. Education is a right, not a privilege.',
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-500/10',
    iconColor: '#ef4444',
  },
  {
    icon: Code,
    title: 'Open Source',
    description:
      'Fully open-source codebase. Audit, fork, or contribute — transparency is our foundation.',
    color: 'from-slate-500 to-zinc-500',
    bgColor: 'bg-slate-500/10',
    iconColor: '#64748b',
  },
];

function FeatureCard({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-border hover:shadow-lg hover:shadow-black/5 transition-all duration-300"
    >
      {/* Hover gradient overlay */}
      <div
        className={`absolute inset-0 rounded-2xl bg-linear-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`}
      />

      <div className="relative z-10">
        <div
          className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
        >
          <feature.icon className="w-6 h-6" style={{ color: feature.iconColor }} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
}

export default function Features() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' });

  return (
    <section id="features" className="scroll-mt-24 sm:scroll-mt-28 py-16 sm:py-20 lg:py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              Features
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Everything you need to learn
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-muted-foreground text-lg"
          >
            Powerful features designed to make knowledge accessible, organized, and delightful.
          </motion.p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
