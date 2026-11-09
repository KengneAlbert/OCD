"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  /** Texte secondaire affiché sous le libellé. */
  description?: string;
  /** Élément affiché à gauche (icône, drapeau…). */
  leading?: ReactNode;
  /** Texte court affiché dans le bouton une fois sélectionné (ex. « +228 »). */
  short?: string;
  /** Regroupement (titre de section dans la liste). */
  group?: string;
  /** Mots supplémentaires pris en compte par la recherche. */
  keywords?: string;
}

interface SelectMenuProps {
  id?: string;
  name?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
  /** Affiche un champ de recherche (conseillé au-delà de ~10 options). */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Autorise à revenir à « aucune valeur ». */
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  /** Largeur minimale du panneau (utile quand le bouton est étroit). */
  panelClassName?: string;
  /** Afficher `short` au lieu de `label` dans le bouton. */
  compact?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
  "aria-label"?: string;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Menu déroulant personnalisé (pattern ARIA « combobox » + « listbox »).
 * Clavier : ↑ ↓ Début Fin Entrée Échap, saisie rapide des premières lettres.
 */
export function SelectMenu({
  id,
  name,
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Choisir…",
  searchable = false,
  searchPlaceholder = "Rechercher…",
  clearable = false,
  disabled,
  className,
  panelClassName,
  compact = false,
  ...aria
}: SelectMenuProps) {
  const autoId = useId();
  const baseId = id ?? `select-${autoId.replace(/:/g, "")}`;
  const listId = `${baseId}-liste`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", timer: 0 as unknown as ReturnType<typeof setTimeout> });

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return options;
    return options.filter((o) => normalize(`${o.label} ${o.description ?? ""} ${o.short ?? ""} ${o.keywords ?? ""}`).includes(q));
  }, [options, query]);

  const close = useCallback(
    (focusButton = true) => {
      setOpen(false);
      setQuery("");
      if (focusButton) buttonRef.current?.focus();
    },
    [],
  );

  const openMenu = () => {
    if (disabled) return;
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    setActive(idx);
    setOpen(true);
  };

  // Ferme au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        close(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close, onBlur]);

  // Focus de la recherche à l'ouverture.
  useEffect(() => {
    if (open && searchable) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open, searchable]);

  // Garde l'option active visible.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open, filtered]);

  useEffect(() => setActive(0), [query]);

  const choose = (opt: SelectOption | undefined) => {
    if (!opt) return;
    onChange(opt.value);
    close();
    onBlur?.();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(filtered.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        choose(filtered[active]);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        onBlur?.();
        break;
      default:
        // Saisie rapide (sans champ de recherche) : saute à l'option qui commence par les lettres tapées.
        if (!searchable && e.key.length === 1 && /\S/.test(e.key)) {
          const t = typeahead.current;
          clearTimeout(t.timer);
          t.text += normalize(e.key);
          t.timer = setTimeout(() => (t.text = ""), 600);
          const idx = filtered.findIndex((o) => normalize(o.label).startsWith(t.text));
          if (idx >= 0) setActive(idx);
        }
    }
  };

  const activeId = filtered[active] ? `${baseId}-opt-${active}` : undefined;

  let lastGroup: string | undefined;

  return (
    <div ref={rootRef} className={cn("relative", className)} onKeyDown={onKeyDown}>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      <button
        ref={buttonRef}
        id={baseId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && !searchable ? activeId : undefined}
        aria-invalid={aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
        aria-required={aria["aria-required"]}
        aria-label={aria["aria-label"]}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        className={cn(
          "group flex h-12 w-full items-center gap-2.5 rounded-2xl border bg-card pr-3 pl-4 text-left text-base shadow-sm transition",
          "border-border hover:border-foreground/30 focus-visible:border-ocd-orange-dark focus-visible:ring-4 focus-visible:ring-ocd-glow/70 focus-visible:outline-none dark:focus-visible:ring-ocd-orange/30",
          "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-ocd-live",
          open && "border-ocd-orange-dark ring-4 ring-ocd-glow/70 dark:ring-ocd-orange/30",
        )}
      >
        {selected?.leading && <span className="flex shrink-0 items-center">{selected.leading}</span>}
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground/80")}>
          {selected ? (compact && selected.short ? selected.short : selected.label) : placeholder}
        </span>
        <ChevronDown
          aria-hidden
          className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180 text-foreground")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute top-[calc(100%+0.5rem)] left-0 z-50 w-full min-w-[16rem] origin-top overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-20px_rgb(17_17_17/0.35)]",
              panelClassName,
            )}
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-border px-3">
                <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  role="searchbox"
                  aria-label={searchPlaceholder}
                  aria-controls={listId}
                  aria-activedescendant={activeId}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Effacer la recherche">
                    <X className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            )}

            <ul ref={listRef} id={listId} role="listbox" aria-labelledby={baseId} className="max-h-72 overflow-y-auto overscroll-contain p-1.5">
              {clearable && !query && (
                <li
                  role="option"
                  aria-selected={!value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange("");
                    close();
                  }}
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  {placeholder}
                </li>
              )}
              {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Aucun résultat pour « {query} »</li>}
              {filtered.map((opt, i) => {
                const header = opt.group && opt.group !== lastGroup ? opt.group : null;
                lastGroup = opt.group;
                const isSelected = opt.value === value;
                const isActive = i === active;
                return (
                  <li key={opt.value} role="presentation">
                    {header && (
                      <p role="presentation" className="px-3 pt-3 pb-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                        {header}
                      </p>
                    )}
                    <div
                      id={`${baseId}-opt-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={isSelected}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(opt)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                        isActive && "bg-ocd-cream dark:bg-white/10",
                        isSelected && "font-semibold",
                      )}
                    >
                      {opt.leading && <span className="flex shrink-0 items-center">{opt.leading}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{opt.label}</span>
                        {opt.description && <span className="block truncate text-xs font-normal text-muted-foreground">{opt.description}</span>}
                      </span>
                      {opt.short && <span className="font-mono text-xs text-muted-foreground">{opt.short}</span>}
                      <Check aria-hidden className={cn("size-4 shrink-0 text-ocd-orange-dark", !isSelected && "invisible")} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
