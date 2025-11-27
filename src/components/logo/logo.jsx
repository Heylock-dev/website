import Image from "next/image";
import LogoBlack32 from "../../../public/LogoBlack32.svg";
import LogoWhite32 from "../../../public/LogoWhite32.svg";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Logo({ className }) {
    return (
        <Link href="/" className={cn("flex items-center", className)}>
            <Image 
                src={LogoWhite32} 
                alt="Heylock Home"
                draggable={false}
                className="inline-block"
            />
        </Link>
    );
}