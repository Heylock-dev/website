import { motion } from "motion/react";
import { twMerge } from "tailwind-merge";

export default function WideBrandButton({ className, onClick, text, type, disabled=false }) {
    return (
        <motion.button 
            className={twMerge("w-full py-2.5 text-white font-medium bg-brand rounded-3xl hover:shadow hover:cursor-pointer disabled:opacity-90 disabled:cursor-not-allowed transition-all duration-200", className)}
            onClick={onClick}
            type={type}
            disabled={disabled}
            whileTap={{ scale: 0.98, transition: { duration: 0.1 }}}
        >
            {text}
        </motion.button>
    );
}