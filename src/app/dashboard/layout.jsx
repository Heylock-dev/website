'use client';

import AppHeader from "@/components/headers/app-header";
import { AppSidebar } from "@/components/ui/app-sidebar";

export default function DashboardLayout({ children }){
    return (
        <div className="flex w-screen min-h-screen">
            {/* Sidebar */}
            <AppSidebar />

            <div className="flex-1 flex flex-col min-h-0 h-screen">
                {/* Header */}
                <AppHeader />
               
                <main className="flex-1 min-h-0">
                    {children}
                </main>
            </div>
        </div>
    );
}