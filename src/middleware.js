import { updateSession } from "./scripts/supabase/middleware";

export async function middleware(request) {
    // return await updateSession(request); UNCOMMENT WHEN INTERNET CONNECTION COMES BACK
}

export const config = {
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}