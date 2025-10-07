import { motion } from "motion/react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import GoogleLogo from "../../../public/LogoGoogle64.png";

export default function GoogleLoginButton({ className, onClick }) {
    return (
        <motion.button
            className={twMerge("w-full py-2.5 gap-2 flex flew-row items-center justify-center border border-deemphasized-button-outline rounded-3xl hover:cursor-pointer", className)}
            onClick={onClick}
            whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
        >
            <Image src={GoogleLogo} alt="Google Logo" className="inline-block w-4 h-4"/>
            <span>Google</span>
        </motion.button>
    );
}