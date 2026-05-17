import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ className }) => {
  return (
    <div className={`relative overflow-hidden bg-[var(--theme-card)] border border-[var(--theme-border)] ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};

export const VideoSkeleton = () => (
  <div className="flex flex-col gap-4 p-4 rounded-[32px] bg-[var(--theme-card)] border border-[var(--theme-border)]">
    <Skeleton className="aspect-video rounded-2xl" />
    <div className="px-2 space-y-3">
      <Skeleton className="h-4 w-3/4 rounded-full" />
      <Skeleton className="h-2 w-1/4 rounded-full" />
    </div>
  </div>
);

export default Skeleton;
