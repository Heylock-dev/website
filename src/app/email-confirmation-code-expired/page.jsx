'use client';

import WideBrandButton from "@/components/buttons/wide-brand-button";
import EmailInput from "@/components/inputs/email-input";
import { useState } from "react";
import { resendConfirmationLink } from "./actions";
import z from "zod";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/all";

export default function EmailConfirmationCodeExpiredPage() {
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);

    async function handleSend(event){
        event.preventDefault();

        if(isSent){
            alert("A new confirmation email has already been sent.");
            return;
        }

        const schema = z.object({
            email: z.email()
        });

        if(schema.safeParse({ email }).success === false) {
            alert('Please enter a valid email address.');
            return;
        }

        const { error } = await resendConfirmationLink(email);

        if(error) {
            alert('Sorry, something went wrong. Please try again in a moment.');
            return;
        }

        setIsSent(true);

        gsap.registerPlugin(ScrambleTextPlugin);

        gsap.to('#gsap-header', {
            duration: 1,
            scrambleText: {
                text: 'Check your inbox',
                chars: '01$&',
                speed: 3
            }
        });

        gsap.to('#gsap-body', {
            duration: 1,
            scrambleText: {
                text: `We've sent a new confirmation link to your email. If you don't see it, please check your spam or junk folder.`,
                chars: '01$&',
                speed: 3
            }
        });
    }

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
            <form className="py-4 px-8 border-b border-r border-deemphasized-grid-outline max-w-[32rem]">
                <h2 className="text-xl font-medium text-center" id="gsap-header">Confirmation Link Expired</h2>
                <p className="text-deemphasized-text mt-2 text-center leading-relaxed" id="gsap-body">
                    Enter your email below and we'll send you a new one.
                </p>
                <EmailInput className="mt-4" value={email} onChange={(event) => {setEmail(event.currentTarget.value)}} placeholder="Your email address"/>
                <WideBrandButton type="submit" className="mt-4" text="Send new link" onClick={handleSend}/>
            </form>
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

            
