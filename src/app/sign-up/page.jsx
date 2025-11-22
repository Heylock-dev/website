'use client';

import Image from "next/image";
import { signUpWithEmail, signUpWithGitHub, signUpWithGoogle } from "./actions";
import LogoBlack32 from "../../../public/LogoBlack64.svg";
import LogoWhite32 from "../../../public/LogoWhite64.svg";
import EmailInput from "@/components/inputs/email-input";
import PasswordInput from "@/components/inputs/password-input";
import WideBrandButton from "@/components/buttons/wide-brand-button";
import GitHubLoginButton from "@/components/buttons/github-login";
import GoogleLoginButton from "@/components/buttons/google-login";
import Link from "next/link";
import { z } from "zod";
import { useState } from "react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/all";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    async function handleEmailSignUp(event) {
        event.preventDefault();

        const schema = z.object({
            email: z.email(),
            password: z
                .string()
                .min(8, "Password must be at least 8 characters long")
                .regex(/[A-Za-z]/, "Password must include at least one letter")
        });

        const validation = schema.safeParse({ email, password });

        if(validation.success === false) {
            if(validation.error.issues[0].path[0] === 'email'){
                changeText("Invalid email", "Please enter a valid email address.");
            } else if (validation.error.issues[0].path[0] === 'password') {
                changeText("Weak password", validation.error.issues[0].message);
            }

            return;
        }

        changeText("Creating your account...", "Almost done!");

        try {
            const { error } = await signUpWithEmail(email, password);
            
            if(typeof error === 'object' && error !== null){
                if(error.code === 'UND_ERR_CONNECT_TIMEOUT') {
                    changeText("Connection timeout", "Please check your internet connection.");
                    return;
                }

                changeText("Unexpected error occured", "Please try again later.");
                return;
            }

            changeText("Welcome aboard!", "Redirecting...");

            setTimeout(() => {
                router.push(`/confirm-email?email=${email}`);
            }, 500);
        } catch(error) {
            console.log(error);

            changeText("Unexpected error occured", "Please try again later.");
            return;
        }
    }

    async function handleGitHub(event) {
        event.preventDefault();

        changeText("Signing up with GitHub...", "Redirecting to GitHub for authentication.");

        await signUpWithGitHub();
    }

    async function handleGoogle(event) {
        event.preventDefault();

        changeText("Signing up with Google...", "Redirecting to Google for authentication.");

        await signUpWithGoogle();
    }

    async function changeText(header, body) {
        gsap.registerPlugin(ScrambleTextPlugin);

        gsap.to('#gsap-header', {
            duration: 0.4,
            scrambleText: {
                text: header,
                chars: '01$&',
                speed: 4
            }
        });

        gsap.to('#gsap-body', {
            duration: 0.4,
            scrambleText: {
                text: body,
                chars: '01$&',
                speed: 4
            }
        });
    }

    return (
        <div className="w-screen h-screen flex flex-row">
            <div className="flex items-center justify-start pl-16  w-1/2 h-full">
                <form className="flex flex-col w-[28rem]">
                    <Link href="/" className="hover:cursor-pointer">
                        <Image src={LogoBlack32} alt="Heylock Logo" className="w-6 dark:hidden" draggable={false}/>
                        <Image src={LogoWhite32} alt="Heylock Logo" className="w-6 hidden dark:block" draggable={false}/>
                    </Link>
                    <h1 className="text-3xl font-medium dark:font-normal mt-4 dark:mt-7">Create an account</h1>
                    
                    <div className="mt-9">
                        <EmailInput value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your best email" autoFocus={true}/>
                        <PasswordInput className="mt-4" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
                    </div>

                    <WideBrandButton className="mt-8" onClick={handleEmailSignUp} text="Create account" type="submit" />
                    <div className="flex flex-row gap-4 mt-4">
                        <GitHubLoginButton onClick={handleGitHub} />
                        <GoogleLoginButton onClick={handleGoogle} />
                    </div>

                    <p className="text-muted-foreground mt-8">Already have an account? <Link href="/sign-in" className="underline underline-offset-2 hover:text-black dark:hover:text-white transition-colors duration-150">Sign in</Link></p>
                </form>
            </div>
            <div
                className="w-3/4 h-full grid"
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
                <div className="border-b border-border"/>
                
                {/* Row 2 */}
                <div className="border-r border-border relative">
                    <div className="absolute left-0 bottom-0 w-full h-[1px]" style={{background: 'linear-gradient(to left, var(--color-border), transparent)'}} />
                </div>
                <div className="py-3 px-6 border-b border-r border-border">
                    <h2 className="text-xl font-medium" id="gsap-header">Founders first</h2>
                    <p className="text-muted-foreground mt-2 whitespace-nowrap" id="gsap-body">We relentlessly focus on saving founder’s time.</p>
                </div>
                <div className="border-b border-border"/>
                
                {/* Row 3 */}
                <div className="border-r border-border"/>
                <div className="border-r border-border"/>
                <div className="border-border"/>
            </div>
        </div>
    );
}