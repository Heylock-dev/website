'use client';

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function EmailConfirmationContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    return (
        <p className="text-muted-foreground mt-2 whitespace-nowrap text-center leading-relaxed">
            We've sent a confirmation link to <span className="font-medium">{email || "your email"}</span>.<br/>
            Check your inbox and spam folder.<br/>
        </p>
    );
}

export default function SignUpPage() {
    return (
        <div
            className="w-screen h-screen grid"
            style={{
                gridTemplateRows: '1fr auto 1fr',
                gridTemplateColumns: 'minmax(6rem,1fr) auto minmax(6rem,1fr)'
            }}
        >
            {/* Row 1 */}
            <div className="border-r border-border relative">
                <div className="absolute left-0 bottom-0 w-full h-[1px]" style={{background: 'linear-gradient(to left, var(--color-border), transparent)'}} />
            </div>
            <div className="border-r border-b border-border"/>
            <div className="border-r border-border relative">
                <div className="absolute left-0 bottom-0 w-full h-[1px]" style={{background: 'linear-gradient(to right, var(--color-border), transparent)'}} />
            </div>
            
            {/* Row 2 */}
            <div className="border-r border-border relative">
                <div className="absolute left-0 bottom-0 w-full h-[1px]" style={{background: 'linear-gradient(to left, var(--color-border), transparent)'}} />
            </div>
            <div className="py-3 px-6 border-b border-r border-border">
                <h2 className="text-xl font-medium text-center">Almost there!</h2>

                <Suspense fallback={
                    <p className="text-muted-foreground mt-2 whitespace-nowrap text-center leading-relaxed">
                        We've sent a confirmation link to your email.<br/>
                        Check your inbox and spam folder.<br/>
                    </p>
                }>
                    <EmailConfirmationContent />
                </Suspense>
            </div>
            <div className="border-r border-border relative">
                <div className="absolute left-0 bottom-0 w-full h-[1px]" style={{background: 'linear-gradient(to right, var(--color-border), transparent)'}} />
            </div>
            
            {/* Row 3 */}
            <div className="border-r border-border"/>
            <div className="border-r border-border"/>
            <div className=""/>
        </div>
    );
}