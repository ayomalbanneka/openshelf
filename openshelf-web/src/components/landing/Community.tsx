'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Users, Heart, MessageCircle, GitBranch, ArrowRight } from 'lucide-react';

const contributors = [
  { name: 'AS', color: 'bg-blue-500' },
  { name: 'MK', color: 'bg-violet-500' },
  { name: 'JD', color: 'bg-emerald-500' },
  { name: 'LP', color: 'bg-amber-500' },
  { name: 'RW', color: 'bg-rose-500' },
  { name: 'TN', color: 'bg-cyan-500' },
  { name: 'YZ', color: 'bg-pink-500' },
  { name: '+2K', color: 'bg-slate-500' },
];

const stats = [
  { icon: Users, value: '2,400+', label: 'Contributors' },
  { icon: Heart, value: '15K+', label: 'GitHub Stars' },
  { icon: MessageCircle, value: '8K+', label: 'Discussions' },
  { icon: GitBranch, value: '5K+', label: 'Pull Requests' },
];

export default function Community() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="community" className="scroll-mt-24 sm:scroll-mt-28 py-16 sm:py-20 lg:py-24 px-4">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-linear-to-br from-blue-600/5 via-card to-violet-600/5">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 text-sm font-medium mb-6"
              >
                <Heart className="w-3.5 h-3.5" />
                Community
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6"
              >
                Built by people who{' '}
                <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-violet-600">
                  believe in education
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground text-lg mb-8 leading-relaxed"
              >
                OpenShelf is maintained by a passionate community of developers, educators, and
                students from around the world. Join us and help make education accessible.
              </motion.p>

              {/* Avatar stack */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="flex justify-center mb-8"
              >
                <div className="flex -space-x-3">
                  {contributors.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.4 + i * 0.05, type: 'spring' }}
                      className={`w-10 h-10 ${c.color} rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                    >
                      {c.name}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8"
              >
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="text-center"
                  >
                    <stat.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <motion.a
                  href="#register"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-foreground text-background font-semibold hover:opacity-90 transition-all group"
                >
                  Join the Community
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.a>
                <motion.a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-border font-semibold hover:bg-muted transition-all"
                >
                  View on GitHub
                </motion.a>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
