import { motion } from "motion/react";
import { twMerge } from "tailwind-merge";

export default function PasswordInput({ className, value, onChange, placeholder }) {
    return (
        <motion.input
            className={twMerge("w-full max-w-xl px-4 pb-2.5 pt-2 border border-no-focus-input focus:border-accent outline-none rounded-xl focus:rounded-lg transition-all duration-150", className)}
            type="password"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    );
}