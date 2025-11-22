import { motion } from "motion/react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import GitHubLogoBlack from "../../../public/LogoGitHubBlack16.svg";
import GitHubLogoWhite from "../../../public/LogoGitHubWhite16.svg";

export default function GitHubLoginButton({ className, onClick }) {
    return (
        <motion.button
            className={twMerge("w-full py-2.5 gap-2 flex flew-row items-center justify-center border border-border hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl hover:rounded-2xl hover:cursor-pointer transition-all duration-150", className)}
            onClick={onClick}
            whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
        >
            <Image src={GitHubLogoBlack} alt="GitHub Logo" className="inline-block dark:hidden"/>
            <Image src={GitHubLogoWhite} alt="GitHub Logo" className="hidden dark:inline-block"/>
            <span>GitHub</span>
        </motion.button>
    );
}