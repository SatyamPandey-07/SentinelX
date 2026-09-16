'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function PageTransition({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
