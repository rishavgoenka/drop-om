import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

function normalize(value) {
  return String(value || '').toLowerCase();
}

const InHouseDropdown = React.forwardRef(function InHouseDropdown(
  {
    value,
    options,
    onChange,
    placeholder = 'Select...',
    searchable = false,
    searchPlaceholder = 'Search...',
    disabled = false,
    className = '',
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const selected = useMemo(
    () => (options || []).find((opt) => opt.value === value) || null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const list = options || [];
    if (!searchable || !query.trim()) return list;
    const q = normalize(query);
    return list.filter((opt) => normalize(opt.label).includes(q));
  }, [options, searchable, query]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open || !searchable) return;
    const frame = requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, searchable]);

  useEffect(() => {
    const onDocPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, []);

  const handleSelect = (nextValue) => {
    onChange?.(nextValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`inhouse-select ${className}`.trim()}>
      <button
        ref={ref}
        type="button"
        className="inhouse-select-trigger"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? 'inhouse-select-value' : 'inhouse-select-placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={open ? 'inhouse-select-chevron open' : 'inhouse-select-chevron'} />
      </button>

      {open && (
        <div className="inhouse-select-menu" role="listbox">
          {searchable && (
            <div className="inhouse-select-search-wrap">
              <Search size={13} className="inhouse-select-search-icon" />
              <input
                ref={searchRef}
                className="inhouse-select-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          )}

          <div className="inhouse-select-options">
            {filtered.length === 0 ? (
              <div className="inhouse-select-empty">No options found</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={opt.value === value ? 'inhouse-select-option active' : 'inhouse-select-option'}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span>{opt.label}</span>
                  {opt.meta ? <span className="inhouse-select-option-meta">{opt.meta}</span> : null}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default InHouseDropdown;
