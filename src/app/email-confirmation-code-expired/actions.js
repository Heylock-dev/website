'use server';

import { createClient } from "@/scripts/supabase/server";

export async function resendConfirmationLink(email){
    const supabase = await createClient();

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email
    });

    if(error !== null) {
        console.log(error);

        return { error };
    }

    return {};
}