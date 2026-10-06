"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH = 160;
const VIEWPORT_PADDING = 8;

function computeMenuPosition(
  rect: DOMRect,
  panelHeight: number,
  width: number,
) {
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUp = spaceBelow < panelHeight + VIEWPORT_PADDING;
  return {
    top: openUp ? rect.top - panelHeight - 4 : rect.bottom + 4,
    left: Math.min(
      window.innerWidth - width - VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, rect.right - width),
    ),
  };
}

export function TableActionsMenu({
  open,
  triggerSelector,
  onClose,
  children,
  width = MENU_WIDTH,
}: {
  open: boolean;
  triggerSelector: string | null;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const panel = panelRef.current;
    if (!panel || !triggerSelector) {
      return;
    }
    const trigger = document.querySelector(triggerSelector);
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const pos = computeMenuPosition(rect, panel.offsetHeight, width);
    panel.style.top = `${pos.top}px`;
    panel.style.left = `${pos.left}px`;
    panel.style.visibility = "visible";
  }, [triggerSelector, width]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const node = event.target as Node;
      if (panelRef.current?.contains(node)) {
        return;
      }
      if (
        triggerSelector &&
        document.querySelector(triggerSelector)?.contains(node)
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, onClose, triggerSelector]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      className="fixed z-[200] rounded-lg border border-black/10 bg-amal-white py-1 shadow-lg"
      style={{ top: 0, left: 0, width, visibility: "hidden" }}
    >
      {children}
    </div>,
    document.body,
  );
}
