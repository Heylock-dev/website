"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
    const router = useRouter();

    useEffect(() => {
        router.replace('https://docs.google.com/spreadsheets/d/14jjBU7zKJmqQOJ1fQQseTsJtVNknLK3pjJuyMmv8Ifs/edit?usp=sharing');
    }, []);

    return <div>Routing...</div>;
}