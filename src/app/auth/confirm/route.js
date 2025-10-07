import { createClient } from "@/scripts/supabase/server";
import { redirect } from "next/navigation";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const next = searchParams.get('next') ?? '/dashboard';

    if(token_hash && type) {
        const supabase = await createClient();

        const { error } = await supabase.auth.verifyOtp({ type, token_hash });

        console.log(error);

        if(error?.code === 'otp_expired'){
            redirect('/email-confirmation-code-expired');
        }

        if(!error) {
            redirect(next);
        }
    }

    redirect(`/sign-up?error=confirmationFailed`);
}