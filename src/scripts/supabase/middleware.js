import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    request.cookies.set(name, value);
                });

                supabaseResponse = NextResponse.next({ request });

                cookiesToSet.forEach(({ name, value, options }) => {
                    supabaseResponse.cookies.set(name, value, options);
                });
            }
        }
    });

    // Do not run anything from line 25 to line 27

    const { data: { user } } = await supabase.auth.getUser();

    // if( // If user is not authenticated and trying to access a protected route
    //     !user && 
    //     request.nextUrl.pathname.startsWith('/dashboard')
    // ) {
    //     const url = request.nextUrl.clone();

    //     url.pathname = '/sign-in';

    //     return NextResponse.redirect(url);
    // }
    //
    if(request.url === 'https://heylock.dev/space/financial-plan') {
        return NextResponse.redirect('https://docs.google.com/spreadsheets/d/14jjBU7zKJmqQOJ1fQQseTsJtVNknLK3pjJuyMmv8Ifs/edit?usp=sharing');
    }

    if(request.url === 'https://heylock.dev/dashboard') {
        return NextResponse.redirect('https://heylock.dev/dashboard/chat');
    }

    return supabaseResponse;
}