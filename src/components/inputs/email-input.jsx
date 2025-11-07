import { motion } from "motion/react";
import { twMerge } from "tailwind-merge";

export default function EmailInput({ className, value, onChange, placeholder, autoFocus=false }) {
    return (
        <motion.input
            className={twMerge("w-full max-w-xl px-4 pb-2.5 pt-2 border border-no-focus-input focus:border-accent outline-none rounded-xl focus:rounded-lg transition-all duration-150", className)}
            type="email"
            value={value}
            autoFocus={autoFocus}
            onChange={onChange}
            placeholder={placeholder}
        />
    );
}