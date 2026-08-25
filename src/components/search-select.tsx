"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type SearchSelectOption = {
  value: string;
  label: string;
  detail?: string;
};

type SearchSelectProps = {
  id?: string;
  label?: ReactNode;
  value: string;
  options: SearchSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
  onChange: (value: string) => void;
};

export function SearchSelect({
  id,
  label,
  value,
  options,
  placeholder = "Type to search",
  disabled = false,
  compact = false,
  invalid = false,
  className = "",
  "aria-label": ariaLabel,
  onChange,
}: SearchSelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [menu, setMenu] = useState({ top: 0, left: 0, width: 220, maxHeight: 240 });

  const selected = options.find((option) => option.value === value);
  const selectedLabel = selected?.label ?? "";

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term || term === selectedLabel.toLowerCase()) return options;
    const terms = term.split(/\s+/).filter(Boolean);
    return options.filter(
      (option) => {
        const searchable = `${option.label} ${option.detail ?? ""}`.toLowerCase();
        return terms.every((word) => searchable.includes(word));
      },
    );
  }, [options, query, selectedLabel]);

  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, compact ? 180 : rect.width);
      const maxHeight = 240;
      const gap = 4;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const openUp = spaceBelow < 160 && rect.top > spaceBelow;
      const top = openUp ? Math.max(8, rect.top - maxHeight - gap) : rect.bottom + gap;
      const left = Math.min(rect.left, window.innerWidth - width - 8);
      setMenu({ top, left: Math.max(8, left), width, maxHeight: openUp ? Math.min(maxHeight, rect.top - 12) : Math.min(maxHeight, spaceBelow) });
    }
    place();
    function close(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      const menuNode = document.getElementById(listId);
      if (menuNode?.contains(event.target as Node)) return;
      setOpen(false);
    }
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.addEventListener("mousedown", close);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("mousedown", close);
    };
  }, [open, compact, listId]);

  useEffect(() => {
    if (!open) return;
    const option = filtered[highlight];
    if (!option) return;
    document.getElementById(`${listId}-${option.value}`)?.scrollIntoView({ block: "nearest" });
  }, [filtered, highlight, listId, open]);

  function commit(nextValue: string) {
    onChange(nextValue);
    const nextLabel = options.find((option) => option.value === nextValue)?.label ?? "";
    setQuery(nextLabel);
    setHighlight(0);
    setOpen(false);
  }

  function onBlur() {
    window.setTimeout(() => {
      if (rootRef.current?.contains(document.activeElement)) return;
      const match = options.find((option) => option.label.toLowerCase() === query.trim().toLowerCase());
      if (match) commit(match.value);
      else if (!query.trim()) commit("");
      else setQuery(selectedLabel);
      setOpen(false);
    }, 120);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[highlight];
      if (open && option) commit(option.value);
      else setOpen(true);
    } else if (event.key === "Tab") {
      const option = filtered[highlight];
      if (open && option) commit(option.value);
    } else if (event.key === "Escape") {
      setQuery(selectedLabel);
      setHighlight(0);
      setOpen(false);
    }
  }

  const inputClass = compact
    ? `h-9 w-full border-0 bg-transparent py-0 pr-7 pl-2 text-sm leading-tight text-slate-900 outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:bg-slate-50 disabled:font-semibold ${invalid ? "bg-amber-50" : ""}`
    : `h-11 w-full rounded-lg border bg-white py-0 pr-10 pl-3 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 ${invalid ? "border-amber-500" : "border-slate-300 focus:border-blue-500"}`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-semibold text-slate-700">
          {label}
        </label>
      ) : null}
      <div className={`relative ${label && !compact ? "mt-1.5" : ""}`}>
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[highlight] ? `${listId}-${filtered[highlight].value}` : undefined}
          aria-label={ariaLabel}
          disabled={disabled}
          value={open ? query : selectedLabel}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => {
            if (disabled) return;
            setQuery(selectedLabel);
            setHighlight(0);
            setOpen(true);
            window.setTimeout(() => inputRef.current?.select(), 0);
          }}
          onBlur={onBlur}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={inputClass}
        />
        <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${compact ? "right-2" : "right-3"}`} aria-hidden>
          ▾
        </span>
      </div>
      {open && !disabled && typeof document !== "undefined"
        ? createPortal(
            <ul
              id={listId}
              role="listbox"
              style={{ top: menu.top, left: menu.left, width: menu.width, maxHeight: menu.maxHeight }}
              className="fixed z-[80] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-slate-500">No matching options</li>
              ) : (
                filtered.map((option, index) => {
                  const active = index === highlight;
                  const chosen = option.value === value;
                  return (
                    <li
                      id={`${listId}-${option.value}`}
                      key={option.value}
                      role="option"
                      aria-selected={chosen}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        commit(option.value);
                      }}
                      onMouseEnter={() => setHighlight(index)}
                      className={`cursor-pointer px-3 py-2 text-sm ${active ? "bg-blue-600 text-white" : chosen ? "bg-blue-50 text-blue-900" : "text-slate-800"}`}
                    >
                      <span className="block font-semibold">{option.label}</span>
                      {option.detail ? <span className={`mt-0.5 block text-xs ${active ? "text-blue-100" : "text-slate-500"}`}>{option.detail}</span> : null}
                    </li>
                  );
                })
              )}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
