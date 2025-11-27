'use server';

import { createClient } from "@/scripts/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signInWithEmail(email, password) {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (typeof error === 'object') {
        return { error };
    }

    revalidatePath('/dashboard', 'layout');
}

export async function signInWithGitHub(){
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

export async function signInWithGoogle(){
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