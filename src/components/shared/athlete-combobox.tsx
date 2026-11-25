"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MS } from "@/components/shared/ms";
import { Avatar } from "@/components/shared/avatar";
import { SPECIALTIES } from "@/lib/sports-science";
import type { AthleteListItem } from "@/lib/types";

export function AthleteCombobox({
  value, onChange, athletes,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  athletes: AthleteListItem[];
}) {
  const [open, setOpen] = useState(false);
  const selected = athletes.find((a) => a.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          aria-controls="athlete-combobox-list"
          className="flex w-full items-center justify-between gap-2 rounded-lg bg-surface-container px-3 py-2.5 text-left shadow-sm transition-colors hover:bg-surface-container-high"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <Avatar firstName={selected.firstName} lastName={selected.lastName} tone="primary" />
              <span className="min-w-0">
                <span className="block truncate font-sans text-[15px] font-bold text-on-surface">
                  {selected.firstName} {selected.lastName}
                </span>
                <span className="block font-label text-[10px] text-secondary">
                  {selected.code} · {SPECIALTIES[selected.specialty]?.chip}
                  {selected.vam ? ` · VAM ${selected.vam} km/h` : " · sin VAM"}
                </span>
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm text-on-surface-variant">
              <MS name="person_search" className="text-[20px] text-secondary" />
              Seleccionar atleta evaluado…
            </span>
          )}
          <MS name="unfold_more" className="shrink-0 text-[20px] text-secondary" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] max-w-[92vw] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar nombre o código…" />
          <CommandList id="athlete-combobox-list">
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {athletes.slice(0, 60).map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.firstName} ${a.lastName} ${a.code}`}
                  onSelect={() => { onChange(a.id); setOpen(false); }}
                >
                  <Avatar firstName={a.firstName} lastName={a.lastName} tone="dim" className="h-7 w-7 text-xs" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{a.firstName} {a.lastName}</p>
                    <p className="font-label text-[10px] text-secondary">{a.code} · {SPECIALTIES[a.specialty]?.chip}</p>
                  </div>
                  {a.id === value ? <MS name="check" className="ml-auto text-[18px] text-primary" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

