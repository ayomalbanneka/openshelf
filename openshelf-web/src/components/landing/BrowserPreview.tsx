"use client";

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import {
  Search,
  BookOpen,
  GraduationCap,
  FileText,
  Filter,
  Star,
  Download,
  Eye,
  Bot,
  Zap,
  FlaskConical,
  Laptop,
  Ruler,
} from 'lucide-react';

const categories = [
  { label: 'All', icon: BookOpen, active: true },
  { label: 'Books', icon: BookOpen, active: false },
  { label: 'Courses', icon: GraduationCap, active: false },
  { label: 'Papers', icon: FileText, active: false },
];

const resources = [
  {
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    category: 'Book',
    rating: 4.8,
    downloads: '12.5K',
    color: 'from-blue-600 to-indigo-600',
    icon: BookOpen,
  },
  {
    title: 'Machine Learning Specialization',
    author: 'Andrew Ng',
    category: 'Course',
    rating: 4.9,
    downloads: '45.2K',
    color: 'from-violet-600 to-purple-600',
    icon: Bot,
  },
  {
    title: 'Physics: Mechanics & Thermodynamics',
    author: 'MIT OpenCourseWare',
    category: 'Course',
    rating: 4.7,
    downloads: '8.3K',
    color: 'from-emerald-600 to-teal-600',
    icon: Zap,
  },
  {
    title: 'Organic Chemistry Exam Papers',
    author: 'University Collection',
    category: 'Paper',
    rating: 4.5,
    downloads: '6.1K',
    color: 'from-amber-600 to-orange-600',
    icon: FlaskConical,
  },
  {
    title: 'The Art of Computer Programming',
    author: 'Donald Knuth',
    category: 'Book',
    rating: 4.9,
    downloads: '18.7K',
    color: 'from-rose-600 to-pink-600',
    icon: Laptop,
  },
  {
    title: 'Linear Algebra Done Right',
    author: 'Sheldon Axler',
    category: 'Book',
    rating: 4.6,
    downloads: '9.8K',
    color: 'from-cyan-600 to-blue-600',
    icon: Ruler,
  },
];

export default function BrowsePreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <section id="browse" className="scroll-mt-24 sm:scroll-mt-28 py-16 sm:py-20 lg:py-24 px-4">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium mb-4"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Library
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Explore the collection
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Discover thousands of resources curated by our global community.
          </motion.p>
        </div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mb-8"
        >
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all duration-300 ${
              searchFocused
                ? 'border-blue-500 shadow-lg shadow-blue-500/10 bg-card'
                : 'border-border bg-card/50'
            }`}
          >
            <Search className={`w-5 h-5 transition-colors ${searchFocused ? 'text-blue-500' : 'text-muted-foreground'}`} />
            <input
              type="text"
              placeholder="Search books, courses, papers..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
              aria-label="Search resources"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <button aria-label="Open filters" className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Filter className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.label
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Resource Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {resources.map((resource, i) => (
            <motion.div
              key={resource.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden hover:border-border hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
            >
              {/* Card top accent */}
              <div className={`h-1.5 bg-linear-to-r ${resource.color}`} />
              
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <resource.icon className="w-7 h-7 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground mb-2">
                      {resource.category}
                    </span>
                    <h3 className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{resource.author}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {resource.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      {resource.downloads}
                    </span>
                  </div>
                  <button aria-label={`View ${resource.title}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-600 text-sm font-medium hover:bg-blue-600 hover:text-white transition-all">
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="text-center mt-8"
        >
          <a
            href="#browse"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors group"
          >
            View all resources
            <motion.span className="group-hover:translate-x-1 transition-transform">→</motion.span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
