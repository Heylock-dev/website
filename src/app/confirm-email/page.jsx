'use client';

import Link from "next/link";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/all";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignUpPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    

    return (
        <div
            className="w-screen h-screen grid"
            style={{
                gridTemplateRows: '1fr auto 1fr',
                gridTemplateColumns: 'minmax(6rem,1fr) auto minmax(6rem,1fr)'
            }}
        >
            {/* Row 1 */}
            <div className="border-r border-deemphasized-grid-outline relative">
                <div className="absolute left-0 bottom-0 w-full h-[1px]" style={{background: 'linear-gradient(to left, var(--color-deemphasized-grid-outline), transparent)'}} />
            </div>
            <div className="border-r border-b border-deemphasized-grid-outline"/>
            <div className="border-r border-deemphasized-grid-outline relative">
                <div className="absolute left-0 bottom-0 w-full h-[1px]" style={{background: 'linear-gradient(to right, var(--color-deemphasized-grid-outline), transparent)'}} />
            </div>
            
            {/* Row 2 */}
            <div className="border-r border-deemphasized-grid-outline relative">
                <div className="absolute left-0 bottom-0 w-full h-[1px]" style={{background: 'linear-gradient(to left, var(--color-deemphasized-grid-outline), transparent)'}} />
            </div>
            <div className="py-3 px-6 border-b border-r border-deemphasized-grid-outline">
                <h2 className="text-xl font-medium text-center">Almost there!</h2>
                <p className="text-deemphasized-text mt-2 whitespace-nowrap text-center leading-relaxed">
                    We've sent a confirmation link to <span className="font-medium">{email || "your email"}</span>.<br/>
                    Check your inbox and spam folder.<br/>
                </p>
            </div>
            <div className="border-r border-deemphasized-grid-outline relative">
                <div className="absolute left-0 bottom-0 w-full h-[1px]" style={{background: 'linear-gradient(to right, var(--color-deemphasized-grid-outline), transparent)'}} />
            </div>
            
            {/* Row 3 */}
            <div className="border-r border-deemphasized-grid-outline"/>
            <div className="border-r border-deemphasized-grid-outline"/>
            <div className=""/>
        </div>
    );
}