import React, { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Columns3, GripVertical, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STORAGE_KEY = "admin-sales-table-layout";

const TYPE_STYLES = {
  "Physical Book": "bg-purple-50 text-purple-700 outline-purple-300",
  "Digital Book": "bg-blue-50 text-blue-700 outline-blue-300",
  Course: "bg-teal-50 text-teal-700 outline-teal-300",
  Bundle: "bg-orange-50 text-orange-700 outline-orange-300",
  Consultation: "bg-indigo-50 text-indigo-700 outline-indigo-300",
  Donation: "bg-rose-50 text-rose-700 outline-rose-300",
  Membership: "bg-amber-50 text-amber-700 outline-amber-300",
};

const STATUS_STYLES = {
  Completed: "bg-green-100 text-green-700",
  Pending: "bg-amber-100 text-amber-700",
  Failed: "bg-red-100 text-red-700",
};

const PAYMENT_STYLES = {
  Paid: "bg-green-100 text-green-800",
  Pending: "bg-amber-100 text-amber-800",
  Failed: "bg-red-100 text-red-800",
};

const columns = [
  {
    id: "id",
    header: "Order ID",
    cell: ({ row }) => (
      <span className="text-teal-600 font-bold">{row.original.id}</span>
    ),
  },
  {
    id: "student",
    header: "Student",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-neutral-950 font-semibold">
          {row.original.student.name}
        </span>
        <span className="text-gray-500 text-xs">
          {row.original.student.email}
        </span>
      </div>
    ),
  },
  {
    id: "book",
    header: "Book",
    cell: ({ row }) => (
      <span className="text-neutral-950 font-semibold line-clamp-2 max-w-[220px]">
        {row.original.book.title}
      </span>
    ),
  },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => (
      <span
        className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-lg outline outline-1 outline-offset-[-1px] text-xs font-bold ${
          TYPE_STYLES[row.original.typeDisplay] ||
          "bg-gray-50 text-gray-700 outline-gray-300"
        }`}
      >
        {row.original.typeDisplay}
      </span>
    ),
  },
  {
    id: "quantity",
    header: "Qty",
    cell: ({ row }) => (
      <span className="text-neutral-950 font-medium">
        &times;{row.original.quantity}
      </span>
    ),
  },
  {
    id: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="text-green-600 font-bold">
        ${row.original.amount.toFixed(2)}
      </span>
    ),
  },
  {
    id: "address",
    header: "Shipping Address",
    cell: ({ row }) => {
      const a = row.original.address;
      if (!a || typeof a === "string") {
        return <span className="text-gray-500">N/A</span>;
      }
      return (
        <div className="flex flex-col text-xs max-w-[200px]">
          <span className="text-neutral-950 font-medium truncate">
            {a.line1}
          </span>
          <span className="text-gray-600 truncate">
            {[a.city, a.country].filter(Boolean).join(", ")}
          </span>
        </div>
      );
    },
  },
  {
    id: "payment",
    header: "Payment",
    cell: ({ row }) => (
      <span
        className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wide ${
          PAYMENT_STYLES[row.original.payment] || "bg-gray-100 text-gray-700"
        }`}
      >
        {row.original.payment}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wide ${
          STATUS_STYLES[row.original.status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="flex items-center gap-1.5 text-neutral-950 font-semibold">
          <Calendar className="size-3.5 text-teal-500" />
          {row.original.date}
        </span>
        <span className="text-gray-500 text-xs ml-5">{row.original.time}</span>
      </div>
    ),
  },
];

const DEFAULT_ORDER = columns.map((c) => c.id);
// Payment duplicates Status (both come from payment_status), so it starts
// hidden to save width. It is one click away in the Columns menu.
const DEFAULT_VISIBILITY = { payment: false };

const loadLayout = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Keep saved order but tolerate columns added or removed since.
    const order = [
      ...(saved?.order || []).filter((id) => DEFAULT_ORDER.includes(id)),
    ];
    DEFAULT_ORDER.forEach((id) => {
      if (!order.includes(id)) order.push(id);
    });
    return {
      order,
      visibility: { ...DEFAULT_VISIBILITY, ...(saved?.visibility || {}) },
    };
  } catch {
    return { order: DEFAULT_ORDER, visibility: DEFAULT_VISIBILITY };
  }
};

const SortableHeader = ({ header }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: header.column.id });

  return (
    <TableHead
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform && { ...transform, y: 0 }),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={`h-10 px-3 text-xs font-bold uppercase tracking-wide text-neutral-950 whitespace-nowrap bg-[#F8FAFC] ${
        isDragging ? "opacity-80 shadow-md" : ""
      }`}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Drag to reorder ${header.column.id} column`}
          className="cursor-grab touch-none text-gray-400 hover:text-gray-700 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
        {flexRender(header.column.columnDef.header, header.getContext())}
      </div>
    </TableHead>
  );
};

const SalesTable = ({ data, isLoading }) => {
  const [layout, setLayout] = useState(loadLayout);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ order: layout.order, visibility: layout.visibility }),
    );
  }, [layout]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    state: { columnOrder: layout.order, columnVisibility: layout.visibility },
    onColumnVisibilityChange: (updater) =>
      setLayout((prev) => ({
        ...prev,
        visibility:
          typeof updater === "function" ? updater(prev.visibility) : updater,
      })),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const visibleIds = table.getVisibleLeafColumns().map((c) => c.id);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setLayout((prev) => ({
      ...prev,
      order: arrayMove(
        prev.order,
        prev.order.indexOf(active.id),
        prev.order.indexOf(over.id),
      ),
    }));
  };

  const resetLayout = () =>
    setLayout({ order: DEFAULT_ORDER, visibility: DEFAULT_VISIBILITY });

  return (
    <>
      <div className="flex justify-end px-6 py-3 border-b border-black/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="size-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Show columns</DropdownMenuLabel>
            {table.getAllLeafColumns().map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
              >
                {typeof column.columnDef.header === "string"
                  ? column.columnDef.header
                  : column.id}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={resetLayout}>
              <RotateCcw className="size-4" />
              Reset layout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader className="bg-[#F8FAFC]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                <SortableContext
                  items={visibleIds}
                  strategy={horizontalListSortingStrategy}
                >
                  {headerGroup.headers.map((header) => (
                    <SortableHeader key={header.id} header={header} />
                  ))}
                </SortableContext>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-black/10 hover:bg-gray-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2.5 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={Math.max(visibleIds.length, 1)}
                  className="py-12 text-center text-gray-500"
                >
                  {isLoading
                    ? "Loading orders..."
                    : "No orders found matching your search and filter criteria."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </>
  );
};

export default SalesTable;
