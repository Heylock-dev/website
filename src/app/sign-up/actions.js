'use server';

import { createClient } from "@/scripts/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signUpWithEmail(email, password) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (typeof error === 'object' && error !== null) {
        return error;
    }

    revalidatePath('/dashboard', 'layout');
    revalidatePath('/confirm-email', 'layout');

    if(typeof data === 'object' && data !== null){
        return data;
    } 
}

export async function signUpWithGitHub(){
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'github',
        options: {
            redirectTo: 'https://heylock.dev/auth/callback'
        } 
    });

    if(data.url) {
        redirect(data.url);
    }
}

export async function signUpWithGoogle(){
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
            redirectTo: 'https://heylock.dev/auth/callback'
        }
     });

    if(data.url) {
        redirect(data.url);
    }
}