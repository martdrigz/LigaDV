import React, { ButtonHTMLAttributes, forwardRef, MouseEvent, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant = "primary", size = "md", children, onClick, ...props }, ref) => {
    const [rippleStyle, setRippleStyle] = useState({});
    const [isRippling, setIsRippling] = useState(false);

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      setRippleStyle({
        width: `${size}px`,
        height: `${size}px`,
        top: `${y}px`,
        left: `${x}px`,
      });
      setIsRippling(true);
      
      setTimeout(() => setIsRippling(false), 500);

      if (onClick) {
        onClick(e);
      }
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden font-bold transition-colors flex items-center justify-center gap-2 outline-none disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-[#eaba3f] text-black shadow-[0_0_20px_rgba(234,186,63,0.3)] hover:bg-[#d9a32c] hover:shadow-[0_0_25px_rgba(234,186,63,0.5)]": variant === "primary",
            "bg-white/10 text-white hover:bg-white/15 border border-white/5": variant === "secondary",
            "bg-transparent border border-white/20 text-white hover:bg-white/5": variant === "outline",
            "bg-transparent text-gray-400 hover:text-white hover:bg-white/5": variant === "ghost",
            "px-3 py-1.5 text-xs rounded-lg": size === "sm",
            "px-5 py-3 text-sm rounded-xl": size === "md",
            "px-6 py-4 text-base rounded-2xl": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
        {isRippling && (
          <span
            className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
            style={rippleStyle}
          />
        )}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";
