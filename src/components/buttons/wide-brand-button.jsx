import { motion } from "motion/react";
import { twMerge } from "tailwind-merge";

export default function WideBrandButton({ className, onClick, text, type, disabled=false }) {
    return (
        <motion.button 
            className={twMerge("w-full py-2.5 text-primary-foreground font-medium bg-primary hover:bg-primary/90 rounded-xl hover:rounded-2xl hover:shadow hover:cursor-pointer disabled:opacity-90 disabled:cursor-not-allowed transition-all duration-200", className)}
            onClick={onClick}
            type={type}
            disabled={disabled}
            whileTap={{ scale: 0.99, transition: { duration: 0.005, ease: 'linear' }}}
        >
            {text}
        </motion.button>
    );
}