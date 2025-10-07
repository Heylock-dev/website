import { motion } from "motion/react";
import { twMerge } from "tailwind-merge";

export default function EmailInput({ className, value, onChange, placeholder }) {
    return (
        <motion.input
            className={twMerge("w-full max-w-xl px-4 pb-2.5 pt-2 border border-no-focus-input focus:border-brand outline-none rounded-xl transition-colors duration-150", className)}
            type="email"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    );
}