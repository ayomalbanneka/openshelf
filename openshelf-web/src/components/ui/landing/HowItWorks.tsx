"use client";

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { UserPlus, Search, BookOpen, Share2 } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Create an Account',
    description: 'Sign up for free in seconds. No credit card required.',
    color: 'from-blue-500 to-cyan-500',
    step: '01',
  },
  {
    icon: Search,
    title: 'Search & Discover',
    description: 'Browse thousands of resources or search for specific topics.',
    color: 'from-violet-500 to-purple-500',
    step: '02',
  },
  {
    icon: BookOpen,
    title: 'Read & Learn',
    description: 'Access content instantly online or download for offline reading.',
    color: 'from-emerald-500 to-teal-500',
    step: '03',
  },
  {
    icon: Share2,
    title: 'Share & Contribute',
    description: 'Help others by sharing resources and contributing to the library.',
    color: 'from-amber-500 to-orange-500',
    step: '04',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-4"
          >
            How it works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Get started in minutes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Simple steps to unlock a world of knowledge.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
              className="relative"
            >
              {/* Connector line (hidden on last item and mobile) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+32px)] right-[-calc(50%-32px)] w-[calc(100%-64px)]">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ delay: 0.5 + i * 0.2, duration: 0.6 }}
                    className="h-0.5 bg-linear-to-r from-border to-border/30 origin-left"
                  />
                </div>
              )}

              <div className="text-center">
                {/* Step number & icon */}
                <div className="relative inline-flex mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-20 h-20 bg-linear-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}
                  >
                    <step.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-foreground text-background rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                    {step.step}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-62.5 mx-auto">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
