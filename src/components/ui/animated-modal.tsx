import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

export function AnimatedModal({ 
  isOpen, 
  onClose, 
  children, 
  className,
  title,
  description,
  icon
}: AnimatedModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25, bounce: 0.2 }}
            className={cn(
              "bg-[#111111]/95 border border-white/10 rounded-3xl p-6 md:p-8 w-full shadow-2xl relative my-8 overflow-hidden",
              className
            )}
          >
            {/* Ambient Background Glow matching 21st.dev style */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none -z-10" />
            
            <button 
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X size={16} />
            </button>
            
            {(title || icon) && (
              <div className="flex flex-col items-center mb-8 text-center mt-2 relative z-10">
                {icon && (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4 shadow-inner"
                  >
                    {icon}
                  </motion.div>
                )}
                {title && (
                   <motion.h3 
                     initial={{ y: 10, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     transition={{ delay: 0.15 }}
                     className="text-2xl font-bold font-display text-white tracking-tight"
                   >
                     {title}
                   </motion.h3>
                )}
                {description && (
                  <motion.p 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-gray-400 mt-2 max-w-xs mx-auto"
                  >
                    {description}
                  </motion.p>
                )}
              </div>
            )}

            <div className="relative z-10">
               {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
