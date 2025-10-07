import { createClient } from "@/scripts/supabase/server";

export default async function Dashboard(){
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    if(error){
        alert(error.message);
    }

    return <p>Hello {data.user.email}</p>
}