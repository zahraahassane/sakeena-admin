import React, { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * One control for "search, then pick": the box you type in and the list you pick
 * from are the same popover. Search is done by the caller (usually on the server),
 * so the list is shown as given and never filtered here.
 *
 * options: [{ value, label, description? }]
 */
const SearchableSelect = ({
  options,
  selected, // the currently selected option, or null
  onSelect,
  search,
  onSearchChange,
  isLoading = false,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-2 bg-stone-100/50 border border-transparent rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-left inter-font"
        >
          <span className={cn("truncate", selected ? "text-stone-800" : "text-stone-400")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-stone-400" />
        </button>
      </PopoverTrigger>
      {/* The booking modal sits at z-[70], so the list has to render above it. */}
      <PopoverContent
        align="start"
        className="z-[80] w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-4 animate-spin text-stone-400" />
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={String(option.value)}
                      onSelect={() => {
                        onSelect(option);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "size-4",
                          selected?.value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-semibold text-stone-800">
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="truncate text-xs text-stone-500">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableSelect;
