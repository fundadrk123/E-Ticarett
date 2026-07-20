"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterOptions } from "@/data/turkiye-locations";

interface SearchableSelectProps {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function SearchableSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  required,
  disabled,
}: SearchableSelectProps) {
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filtered = filterOptions(options, query);

  const handleSelect = (option: string) => {
    onChange(option);
    setQuery(option);
    setOpen(false);
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      if (!options.some((opt) => opt.toLocaleLowerCase("tr") === query.toLocaleLowerCase("tr"))) {
        setQuery(value);
      }
    }, 150);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          autoComplete="off"
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          className={cn(
            "w-full rounded-lg border border-slate-300 py-2.5 pl-4 pr-10 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200",
            disabled && "cursor-not-allowed bg-slate-100 text-slate-400"
          )}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {open && !disabled && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {filtered.map((option) => (
            <li key={option}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(option)}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm transition hover:bg-primary-50 hover:text-primary-700",
                  value === option && "bg-primary-50 font-medium text-primary-700"
                )}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !disabled && query && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
          Sonuç bulunamadı
        </div>
      )}
    </div>
  );
}
