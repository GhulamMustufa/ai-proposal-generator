"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  theme?: "indigo" | "amber";
}

export function TagsInput({ value, onChange, suggestions, placeholder = "Type and press Enter...", theme = "indigo" }: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const uniqueSuggestions = Array.from(new Set(suggestions));
  const filteredSuggestions = uniqueSuggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && focusedIndex >= 0 && filteredSuggestions[focusedIndex]) {
        addTag(filteredSuggestions[focusedIndex]);
      } else {
        addTag(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const colors = {
    indigo: {
      tagBg: "bg-indigo-50 dark:bg-indigo-500/10",
      tagText: "text-indigo-700 dark:text-indigo-300",
      tagBtn: "text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200",
      focusBorder: "focus-within:border-indigo-500 focus-within:ring-indigo-500",
      hoverBg: "hover:bg-indigo-50 dark:hover:bg-indigo-500/10",
      activeBg: "bg-indigo-50 dark:bg-indigo-500/10",
      activeText: "text-indigo-600 dark:text-indigo-400"
    },
    amber: {
      tagBg: "bg-amber-50 dark:bg-amber-500/10",
      tagText: "text-amber-700 dark:text-amber-300",
      tagBtn: "text-amber-400 hover:text-amber-600 dark:hover:text-amber-200",
      focusBorder: "focus-within:border-amber-500 focus-within:ring-amber-500",
      hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-500/10",
      activeBg: "bg-amber-50 dark:bg-amber-500/10",
      activeText: "text-amber-600 dark:text-amber-400"
    }
  }[theme];

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`w-full flex flex-wrap gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm text-slate-900 dark:text-white focus-within:ring-1 transition-colors ${colors.focusBorder}`}
        onClick={() => setIsOpen(true)}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className={`flex items-center gap-1 ${colors.tagBg} ${colors.tagText} px-2 py-1 rounded-md text-xs font-medium`}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className={`${colors.tagBtn} transition`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent focus:outline-none placeholder:text-slate-400"
        />
      </div>

      {isOpen && (inputValue.length > 0 || filteredSuggestions.length > 0) && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#1a1a1c] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              onClick={() => addTag(suggestion)}
              onMouseEnter={() => setFocusedIndex(index)}
              className={`px-4 py-2 cursor-pointer text-sm transition-colors ${
                index === focusedIndex
                  ? `${colors.activeBg} ${colors.activeText}`
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              {suggestion}
            </div>
          ))}
          {inputValue.trim() !== "" &&
            !filteredSuggestions.some(
              (s) => s.toLowerCase() === inputValue.trim().toLowerCase()
            ) && (
              <div
                onClick={() => addTag(inputValue)}
                className={`px-4 py-2 cursor-pointer text-sm transition-colors ${
                  focusedIndex === -1
                    ? `${colors.activeBg} ${colors.activeText}`
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                Add "{inputValue.trim()}"
              </div>
            )}
        </div>
      )}
    </div>
  );
}
