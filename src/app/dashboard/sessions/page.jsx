import SessionsTable from "@/components/tables/sessions-table";

export default function SessionsPage() {
    return (
        <div className="p-4 h-full">
            <h1 className="text-2xl font-bold mb-4">Sessions</h1>
            {/* Some quick stats, graphs */}
            <SessionsTable />
        </div>
    );
}