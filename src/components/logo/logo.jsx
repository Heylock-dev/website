import Image from "next/image";
import LogoBlack32 from "../../../public/LogoBlack32.svg";
import LogoWhite32 from "../../../public/LogoWhite32.svg";
import Link from "next/link";

export default function Logo({ className }) {
    return (
        <Link href="/" className={className}>
            <Image 
                src={LogoBlack32} 
                alt="Heylock Home"
                draggable={false}
                className="dark:hidden inline-block"
            />
            <Image 
                src={LogoWhite32} 
                alt="Heylock Home"
                draggable={false}
                className="hidden dark:inline-block"
            />
        </Link>
    );
}