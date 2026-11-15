import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from 'lucide-react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';
import { formatDateInputDisplay } from '@/utils/date-format';
import { DatePickerPanel } from './date-picker-panel';

const POPOVER_WIDTH = 300;

export type DateInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> & {
  value: string;
  onChange: (value: string) => void;
};

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, value, onChange, min, max, disabled, id, ...props }, ref) => {
    const isDark = useShellTheme();
    const fallbackId = useId();
    const inputId = id ?? fallbackId;
    const anchorRef = useRef<HTMLInputElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const setAnchorRef = (node: HTMLInputElement | null) => {
      anchorRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
        return;
      }
      if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    };

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const maxLeft = window.innerWidth - POPOVER_WIDTH - 8;
      const left = Math.max(8, Math.min(rect.left, maxLeft));
      const top = Math.min(rect.bottom + 6, window.innerHeight - 360);

      setPosition({ top, left });
    };

    const openCalendar = () => {
      if (disabled) return;
      setIsOpen(true);
    };

    const closeCalendar = () => setIsOpen(false);

    useLayoutEffect(() => {
      if (!isOpen) return;
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen) return;

      const handlePointerDown = (event: MouseEvent) => {
        const target = event.target as Node;
        if (anchorRef.current?.contains(target) || popoverRef.current?.contains(target)) {
          return;
        }
        closeCalendar();
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') closeCalendar();
      };

      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handlePointerDown);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen]);

    const minValue = min != null ? String(min) : undefined;
    const maxValue = max != null ? String(max) : undefined;

    return (
      <>
        <div className="relative">
          <input
            ref={setAnchorRef}
            type="text"
            readOnly
            id={inputId}
            value={value ? formatDateInputDisplay(value) : ''}
            placeholder="gg.aa.iiii"
            disabled={disabled}
            onClick={openCalendar}
            onFocus={openCalendar}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openCalendar();
              }
              if (event.key === 'Escape') closeCalendar();
            }}
            className={cn('cursor-pointer pr-10', className)}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            {...props}
          />
          <Calendar
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
        </div>

        {isOpen &&
          createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[130] w-[18.75rem] max-w-[calc(100vw-1rem)]"
              style={{ top: position.top, left: position.left }}
              role="dialog"
              aria-modal="true"
              aria-label="Tarix seçimi"
            >
              <div
                className={cn(
                  'rounded-xl border p-3 shadow-xl',
                  isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-white'
                )}
              >
                <DatePickerPanel
                  value={value}
                  min={minValue}
                  max={maxValue}
                  onChange={(nextValue) => {
                    onChange(nextValue);
                    closeCalendar();
                  }}
                />
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }
);

DateInput.displayName = 'DateInput';
