"use client";

import { useState, useEffect } from "react";
import { flexRender, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getFacetedRowModel, getFacetedUniqueValues, getFacetedMinMaxValues, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSessionsStore } from "@/stores/sessionsStore";
import { ChevronRight, EyeClosed, ArrowUp, ArrowDown, MoreHorizontal, ChevronDown, CopyIcon, CheckIcon } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { useTeamStore } from "@/stores/teamStore";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "../ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { useSearchParams } from 'next/navigation';
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { toast } from "sonner";

// Server-side embedding: use `/api/vectorize` endpoint instead of client-side `embed` to avoid browser fetch CORS and headers issues

export default function SessionsTable() {
    const sessions = useSessionsStore((state) => state.sessions);
    const totalCount = useSessionsStore((state) => state.totalCount);
    const fetchAndMergeTeamSessions = useSessionsStore((state) => state.fetchAndMergeTeamSessions);
    const deleteSession = useSessionsStore((state) => state.deleteSession);
    const deleteSessions = useSessionsStore((state) => state.deleteSessions);
    const teamId = useTeamStore((state) => state.id);

    // Helper function to format date and time
    const formatDateTime = (date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const dateStr = `${day}.${month}.${year}`;

        return `${timeStr} ${dateStr}`;
    };

    // Helper function to format duration
    const formatDuration = (createdAt, lastPulse) => {
        // Calculate duration in milliseconds
        const durationMs = lastPulse.getTime() - createdAt.getTime();                    
        const totalSeconds = Math.floor(durationMs / 1000);
        
        let formattedDuration = '';
        if (totalSeconds < 60) {
            formattedDuration = `${totalSeconds}s`;
        } else if (totalSeconds < 3600) {
            const minutes = Math.floor(totalSeconds / 60);
            formattedDuration = `${minutes}m`;
        } else {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            formattedDuration = `${hours}h ${minutes}m`;
        }
        
        return formattedDuration;
    };

    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 20,
    });
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnVisibility, setColumnVisibility] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('sessions_table_column_visibility');
            return stored ? JSON.parse(stored) : {};
        }
        return {};
    });

    useEffect(() => {
        if (teamId) {
            const from = pagination.pageIndex * pagination.pageSize;
            fetchAndMergeTeamSessions(teamId, from, pagination.pageSize);
        }
    }, [teamId, pagination.pageIndex, pagination.pageSize, fetchAndMergeTeamSessions]);

    // Initialize the search input from the url query param `search`, only if not set yet
    const searchParams = useSearchParams();
    useEffect(() => {
        try {
            const param = searchParams?.get('search');
            if (param && !globalFilter) {
                setGlobalFilter(param);
            }
        } catch (error) {
            // ignore
        }
    }, [searchParams]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('sessions_table_column_visibility', JSON.stringify(columnVisibility));
        }
    }, [columnVisibility]);

    const [showDeletionDialog, setShowDeletionDialog] = useState(false)
    const [selectedSessionUUID, setSelectedSessionUUID] = useState(null)

    const [isBulkDelete, setIsBulkDelete] = useState(false)
    const [selectedSessions, setSelectedSessions] = useState([])
    const [isVectorizing, setIsVectorizing] = useState(false);

    function handleDeleteRow(sessionUUID) {
        setSelectedSessionUUID(sessionUUID);
        setShowDeletionDialog(true);
    }

    function handleBulkDelete() {
        const selectedRows = table.getSelectedRowModel().rows;
        const uuids = selectedRows.map(row => row.getValue('uuid'));
        setSelectedSessions(uuids);
        setIsBulkDelete(true);
        setShowDeletionDialog(true);
    }

    async function handleVectorize(sessionUUID) {
        console.log('vectorize requested', sessionUUID);

        try {
            if (isVectorizing) return null;
            setIsVectorizing(true);
            const response = await fetch('/api/vectorize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    sessionUUID: sessionUUID,
                    teamId: teamId
                }),
            });

            const json = await response.json();

            if (!response.ok) {
                const msg = json?.error?.message || json?.error?.name || 'Vectorization failed';
                console.error('Vectorize server error', json);
                toast(`Vectorize failed – ${msg}`, { position: 'top-center', icon: '❌', duration: 4000 });
                return null;
            }

            if (json && json.vectorStored) {
                toast('Vectorized & stored successfully', { position: 'top-center', icon: '✅', duration: 2000 });
            } else {
                toast('Vectorized successfully (not stored)', { position: 'top-center', icon: '⚠️', duration: 3000 });
            }
            return json;
        } catch (error) {
            console.error('Vectorize failed', error);
            const msg = error?.message || 'Vectorization failed';
            toast(`Vectorize failed – ${msg}`, { position: 'top-center', icon: '❌', duration: 4000 });
            return null;
        } finally {
            setIsVectorizing(false);
        }
    }

    const CopyUUID = ({ value, label = 'ID', timeout = 1600 }) => {
        const [copied, setCopied] = useState(false);

        const copyToClipboard = async (event) => {
            event.stopPropagation();
            if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
                toast('Clipboard is not available', { position: 'top-center', icon: '❌' });
                return;
            }

            try {
                await navigator.clipboard.writeText(value);
                setCopied(true);

                toast(`${label} copied to clipboard`, { position: 'top-center', icon: '📋', duration: 1200 });

                setTimeout(() => setCopied(false), timeout);
            } catch (err) {
                toast('Failed to copy', { position: 'top-center', icon: '❌' });
            }
        };

        return (
            <Button
                variant="ghost"
                size="icon"
                aria-label={`Copy ${label}`}
                onClick={copyToClipboard}
                className="h-7 w-7 p-1"
            >
                {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="text-muted-foreground h-2 w-2" />}
            </Button>
        );
    };

    const table = useReactTable({
        data: sessions || [],
        columns: [
            { 
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() && "indeterminate")
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            { 
                accessorKey: 'uuid', 
                header: "Session ID",
                label: "Session ID",
                cell: ({ row }) => {
                    const uuid = row.getValue('uuid');
                    return (
                        <div className="group flex items-center gap-2">
                            <Link href={`/dashboard/sessions/${uuid}`} className="hover:underline underline-offset-2">
                                {uuid}
                            </Link>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyUUID value={uuid} label="Session ID"/>
                            </div>
                        </div>
                    )
                }
            },
            { 
                accessorKey: 'badges', 
                header: 'Tags', 
                label: 'Tags',
                cell: ({ row }) => {
                    const replaySize = row.original.replay_size;
                    const hasReplay = replaySize && replaySize > 0;
                    const tags = Array.isArray(row.original.tags) ? row.original.tags : [];

                    return (
                        <div className="flex gap-1.5 flex-wrap">
                            {tags.map((tag) => {
                                return (
                                    <Badge
                                        key={tag}
                                        variant="default"
                                        className="!border-transparent"
                                    >
                                        {tag}
                                    </Badge>
                                )
                            })}

                            {hasReplay && <Badge variant="secondary">Replay</Badge>}
                        </div>
                    );
                },
            },
            { 
                accessorKey: 'sub_user_uuid', 
                header: "User ID",
                label: "User ID",
                cell: ({ row }) => {
                    const userUuid = row.getValue('sub_user_uuid');
                    const userIdentifier = row.original.sub_user_identifier;
                    return (
                        <div className="group flex items-center gap-2">
                            <div>{userIdentifier ? userIdentifier : userUuid}</div>
                            <div className="opacity-0 group-hover:opacity-100">
                                <CopyUUID value={userIdentifier ? userIdentifier : userUuid} label={userIdentifier ? 'User' : 'User ID'}/>
                            </div>
                        </div>
                    )
                }
            },
            { 
                accessorKey: 'created_at', 
                header: ({ column }) => {
                    return (
                        <Tooltip key={column.id}>
                            <TooltipTrigger>
                                <div
                                    className="flex gap-1 items-center hover:cursor-pointer"
                                    onClick={() => {
                                        if (column.getIsSorted() === "asc") {
                                            column.toggleSorting(true); // desc
                                        } else if (column.getIsSorted() === "desc") {
                                            column.clearSorting(); // no sorting
                                        } else {
                                            column.toggleSorting(false); // asc
                                        }
                                    }}
                                >
                                    <span className="hover:underline">
                                        Time & Date
                                    </span>
                                    {column.getIsSorted() && (
                                        column.getIsSorted() === "desc" ? (
                                            <ArrowUp className="ml-2 h-4 w-4" />
                                        ) : (
                                            <ArrowDown className="ml-2 h-4 w-4" />
                                        )
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {
                                    column.getIsSorted() ?
                                        column.getIsSorted() === "desc" ?
                                            "Sorted descending"
                                        :
                                            "Sorted ascending"
                                    : "Sort by initiation date and time"
                                }
                                
                            </TooltipContent>
                        </Tooltip>
                    )
                },
                cell: ({ row }) => {
                    const date = new Date(row.getValue('created_at'));
                    return <div>{formatDateTime(date)}</div>
                },
                label: "Time & Date"
            },
            { 
                accessorKey: 'last_pulse',
                header: ({ column }) => {
                    return (
                        <Tooltip key={column.id}>
                            <TooltipTrigger>
                                <div
                                    className="flex gap-1 items-center hover:cursor-pointer"
                                    onClick={() => {
                                        if (column.getIsSorted() === "asc") {
                                            column.toggleSorting(true); // desc
                                        } else if (column.getIsSorted() === "desc") {
                                            column.clearSorting(); // no sorting
                                        } else {
                                            column.toggleSorting(false); // asc
                                        }
                                    }}
                                >
                                    <span className="hover:underline">
                                        Duration
                                    </span>
                                    {column.getIsSorted() && (
                                        column.getIsSorted() === "desc" ? (
                                            <ArrowDown className="ml-2 h-4 w-4" />
                                        ) : (
                                            <ArrowUp className="ml-2 h-4 w-4" />
                                        )
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {
                                    column.getIsSorted() ?
                                        column.getIsSorted() === "desc" ?
                                            "Sorted descending"
                                        :
                                            "Sorted ascending"
                                    : "Sort by duration"
                                }
                                
                            </TooltipContent>
                        </Tooltip>
                    )
                },
                sortingFn: (rowA, rowB) => {
                    const createdAtA = new Date(rowA.getValue('created_at'));
                    const lastPulseA = new Date(rowA.getValue('last_pulse'));
                    const durationA = lastPulseA.getTime() - createdAtA.getTime();

                    const createdAtB = new Date(rowB.getValue('created_at'));
                    const lastPulseB = new Date(rowB.getValue('last_pulse'));
                    const durationB = lastPulseB.getTime() - createdAtB.getTime();

                    return durationA - durationB;
                },
                cell: ({ row }) => {
                    const createdAt = new Date(row.getValue('created_at'));
                    const lastPulse = new Date(row.getValue('last_pulse'));
                    return <div>{formatDuration(createdAt, lastPulse)}</div>
                },
                label: "Duration"
            },
            {
                id: 'actions',
                accessorKey: '',
                header: '',
                cell: ({ row }) => <div className="flex gap-2">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    navigator.clipboard.writeText(row.getValue('uuid'));
                                    toast('Session ID copied to clipboard', { position: 'top-center', icon: '📋', duration: 1500 });
                                }}
                            >
                                Copy session uuid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    const id = row.getValue('sub_user_uuid');
                                    if (!id) {
                                        toast('No user ID available', { position: 'top-center', icon: '❌' });
                                        return;
                                    }

                                    navigator.clipboard.writeText(id);
                                    toast('User ID copied to clipboard', { position: 'top-center', icon: '📋', duration: 1500 });
                                }}
                            >
                                Copy user uuid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    const id = row.getValue('uuid');

                                    handleVectorize(id);

                                    toast('Vectorizing session...', { position: 'top-center', icon: '📋', duration: 1500 });
                                }}
                            >
                                Vectorize
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <Link href={`/dashboard/sessions/${row.getValue('uuid')}`}>
                                <DropdownMenuItem>Open</DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem variant="destructive" onClick={() => handleDeleteRow(row.getValue('uuid'))}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Link href={`/dashboard/sessions/${row.getValue('uuid')}`}>
                        <Button variant="outline" size="icon">
                            <ChevronRight />
                        </Button>
                    </Link>
                </div>,
                enableHiding: false,
            },
        ],
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        globalFilterFn: (row, columnId, filterValue) => {
            const search = filterValue.toLowerCase();
            const uuid = row.getValue('uuid')?.toLowerCase() || '';
            const userId = row.getValue('sub_user_uuid')?.toLowerCase() || '';
            const userIdentifier = (row.original.sub_user_identifier || '').toLowerCase();
            
            // Check tags (Replay)
            const hasReplay = row.original.replay_size && row.original.replay_size > 0;
            const tagsList = Array.isArray(row.original.tags) ? row.original.tags : [];
            const tags = `${tagsList.join(',')}${hasReplay ? (tagsList.length ? ',' : '') + 'replay' : ''}`.toLowerCase();
            
            // Check date & time
            const dateTime = formatDateTime(new Date(row.getValue('created_at'))).toLowerCase();
            
            // Check duration
            const duration = formatDuration(new Date(row.getValue('created_at')), new Date(row.getValue('last_pulse'))).toLowerCase();
            
            return uuid.includes(search) || userId.includes(search) || userIdentifier.includes(search) || tags.includes(search) || dateTime.includes(search) || duration.includes(search);
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        manualPagination: true,
        pageCount: Math.ceil(totalCount / pagination.pageSize),
        onPaginationChange: setPagination,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            pagination,
            rowSelection,
            globalFilter,
            columnVisibility,
        },
    });

    return (
        <>
            {
                sessions !== null && sessions?.length !== 0
                ? <div className="w-full">
                    <div className="flex items-center py-4">
                        <Input
                            placeholder="Search..."
                            value={globalFilter}
                            onChange={(event) => setGlobalFilter(event.target.value)}
                            className="max-w-sm"
                        />
                        {table.getSelectedRowModel().rows.length > 0 && (
                            <Button className="ml-4" variant="destructive" onClick={handleBulkDelete}>
                                Delete Selected ({table.getSelectedRowModel().rows.length})
                            </Button>
                        )}
                        <div className="ml-auto flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        Columns <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {table.getAllColumns().filter(column => column.getCanHide()).map(column => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={value => column.toggleVisibility(!!value)}
                                        >
                                            {column.columnDef.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            {
                                table.getHeaderGroups().map((headerGroup, index) => (
                                    <TableRow key={headerGroup.id+'-'+index}>
                                        {
                                            headerGroup.headers.map((header, index) => {
                                                return (
                                                    <TableHead key={header.id+`-`+index} className="!text-left [&>button]:!justify-start">
                                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </TableHead>
                                                )
                                            })
                                        }
                                    </TableRow>
                                ))
                            }
                        </TableHeader>
                        <TableBody>
                            {
                                table.getRowModel().rows?.length > 0 && (
                                    table.getRowModel().rows.map(row => (
                                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                            {row.getVisibleCells().map((cell, index) => (
                                                <TableCell key={cell.id+`-`+index}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )
                            }
                        </TableBody>
                    </Table>
                    
                    {/* Pagination Controls */}
                    <div className="relative px-2 py-4 mt-2">
                        <div className="flex justify-center h-full">
                            <span className="absolute left-2 text-sm text-muted-foreground whitespace-nowrap">
                                Showing{' '}
                                {Math.min(
                                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                    totalCount
                                )}{' '}
                                of {totalCount} results
                            </span>
                        </div>
                        <div className="flex justify-center -translate-y-1.5">
                            <Pagination className="">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => table.previousPage()}
                                            className={cn(
                                                !table.getCanPreviousPage() && "pointer-events-none opacity-50"
                                            )}
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <div className="flex items-center px-3 text-sm font-medium">
                                            Page {table.getState().pagination.pageIndex + 1} of{' '}
                                            {table.getPageCount()}
                                        </div>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => table.nextPage()}
                                            className={cn(
                                                !table.getCanNextPage() && "pointer-events-none opacity-50"
                                            )}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                </div>
                :  sessions === null
                    ? <Empty className="m-auto -translate-y-12 h-full">
                        <Spinner className="w-6 h-6"/>
                    </Empty>
                    : <Empty className="m-auto -translate-y-12 h-full">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <EyeClosed />
                            </EmptyMedia>
                            <EmptyTitle>No sessions found</EmptyTitle>
                            <EmptyDescription>
                                There are no sessions available for this team yet.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent className="grid gap-4 grid-cols-2">
                            <Link href={"ADDDOCSMOTHERFUCKER"}>
                                <Button className="h-full w-full">
                                    How to capture
                                </Button>
                            </Link>
                            <Button variant="outline" onClick={() => fetchAndMergeTeamSessions(teamId)}>
                                Retry
                            </Button>
                        </EmptyContent>
                    </Empty>
            }

            <Dialog open={showDeletionDialog} onOpenChange={(open) => {
                setShowDeletionDialog(open);
                if (!open) {
                    setSelectedSessionUUID(null);
                    setSelectedSessions([]);
                    setIsBulkDelete(false);
                }
            }}>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isBulkDelete ? 'Delete Sessions' : 'Delete Session'}</DialogTitle>
                    <DialogDescription>
                        {isBulkDelete 
                            ? 'Are you sure you want to delete the selected sessions? This action cannot be undone.'
                            : 'Are you sure you want to delete this session? This action cannot be undone.'
                        }
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" variant="destructive" onClick={async () => {
                        if (isBulkDelete) {
                            if (selectedSessions.length === 0) {
                                setShowDeletionDialog(false);
                                return;
                            }

                            const success = await deleteSessions(selectedSessions);

                            if (success) {
                                toast('Sessions deleted successfully', { position: 'top-center', icon: '🗑️', duration: 1500 });
                                setRowSelection({});
                            } else {
                                toast('Failed to delete selected sessions', { position: 'top-center', icon: '❌', duration: 1500 });
                            }
                        } else {
                            if (selectedSessionUUID) {
                                const success = await deleteSession(selectedSessionUUID);
                                if (success) {
                                    toast('Session deleted successfully', { position: 'top-center', icon: '🗑️', duration: 1500 });
                                } else {
                                    toast('Failed to delete session', { position: 'top-center', icon: '❌', duration: 1500 });
                                }
                            }
                        }
                        setShowDeletionDialog(false);
                        setSelectedSessionUUID(null);
                        setSelectedSessions([]);
                        setIsBulkDelete(false);
                    }}>Delete</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}