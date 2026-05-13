"use client";

import { useLayoutEffect, useRef, useState } from "react";

import CrossingCornerBorder from "@/components/CrossingCornerBorder";

type SelectorItem = {
  id: string;
  num?: string;
  label: string;
};

type IndexedSelectorProps = {
  items: readonly SelectorItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
  showArrow?: boolean;
};

export default function IndexedSelector({
  items,
  value,
  onChange,
  ariaLabel,
  className = "",
  showArrow = true,
}: IndexedSelectorProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeRect, setActiveRect] = useState<{
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  useLayoutEffect(() => {
    const list = listRef.current;
    const activeIndex = items.findIndex((item) => item.id === value);
    const activeItem = itemRefs.current[activeIndex];

    if (!list || !activeItem) return;

    const listRect = list.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    setActiveRect({
      left: Math.round(itemRect.left - listRect.left),
      width: Math.round(itemRect.width),
      height: Math.round(itemRect.height),
    });
  }, [items, value]);

  return (
    <nav
      className={`pointer-events-auto ${className}`}
      aria-label={ariaLabel}
    >
      <div className="relative">
        {activeRect !== null && (
          <>
            <div
              className="absolute top-0 z-0 transition-[left,width,height] duration-300 ease-out"
              style={{
                left: activeRect.left,
                width: activeRect.width,
                height: activeRect.height,
              }}
              aria-hidden
            >
              <CrossingCornerBorder
                bleed="clamp(2px, 0.208vw, 4px)"
                thickness="clamp(1px, 0.052vw, 1px)"
                className="h-full w-full bg-foreground"
              >
                <div className="h-full w-full" />
              </CrossingCornerBorder>
            </div>
            <div
              className="absolute top-0 z-20 overflow-hidden transition-[left,width,height] duration-300 ease-out pointer-events-none"
              style={{
                left: activeRect.left,
                width: activeRect.width,
                height: activeRect.height,
              }}
              aria-hidden
            >
              <div
                className="flex items-stretch gap-[clamp(10px,0.9vw,14px)] text-background transition-transform duration-300 ease-out"
                style={{ transform: `translate3d(-${activeRect.left}px, 0, 0)` }}
              >
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-[clamp(6px,1vw,18px)] px-[clamp(8px,0.625vw,12px)] py-[clamp(5px,0.35vw,7px)]"
                  >
                    <span className="flex items-center gap-[clamp(6px,0.7vw,10px)] font-general font-medium tracking-tight leading-none text-[clamp(14px,0.9vw,16px)]">
                      {item.num && (
                        <span className="tabular-nums text-[0.8em] opacity-50">
                          {item.num}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </span>
                    {showArrow && (hoveredIndex === index || item.id === value) && (
                      <span className="font-quicksand text-[clamp(11px,0.677vw,13px)] opacity-70">
                        »»
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <ul ref={listRef} className="relative z-10 flex items-stretch gap-[clamp(10px,0.9vw,14px)]">
          {items.map((item, index) => {
            const isActive = item.id === value;

            return (
              <li key={item.id}>
                <button
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onChange(item.id)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(-1)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(-1)}
                  className={`flex items-center justify-between gap-[clamp(6px,1vw,18px)] px-[clamp(8px,0.625vw,12px)] py-[clamp(5px,0.35vw,7px)] transition-colors duration-300 cursor-pointer ${
                    isActive
                      ? "text-foreground"
                      : "text-foreground/80 hover:bg-foreground/10 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-[clamp(6px,0.7vw,10px)] font-general font-medium tracking-tight leading-none text-[clamp(14px,0.9vw,16px)]">
                    {item.num && (
                      <span className="tabular-nums text-[0.8em] opacity-50">
                        {item.num}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </span>
                  {showArrow && (hoveredIndex === index || isActive) && (
                    <span
                      className="font-quicksand text-[clamp(11px,0.677vw,13px)] opacity-70"
                      aria-hidden
                    >
                      »»
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
