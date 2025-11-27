import { motion } from "motion/react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import GoogleLogo from "../../../public/LogoGoogle64.png";

export default function GoogleLoginButton({ className, onClick }) {
    return (
        <motion.button
            className={twMerge("w-full py-2.5 gap-2 flex flew-row items-center justify-center border border-deemphasized-button-outline hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl hover:rounded-2xl hover:cursor-pointer transition-all duration-150", className)}
            onClick={onClick}
            whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
        >
            <Image src={GoogleLogo} alt="Google Logo" className="inline-block w-4 h-4"/>
            <span className="font-normal">Регистрация через Google</span>
        </motion.button>
    );
}