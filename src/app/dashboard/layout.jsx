export default function DashboardLayout({ children }){
    return (
        <div className="flex w-screen min-h-screen">
            {/* Sidebar */}
            <div className="h-screen w-64 border-r border-deemphasized-grid-outline">
                {/* Sidebar content will go here */}
            </div>
            
            <div className="flex-1">
                {/* Header */}
                <header className="h-16 px-6 flex items-center border-b border-deemphasized-grid-outline">
                    {/* Header content will go here */}
                </header>
                
                {/* Page content */}
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}