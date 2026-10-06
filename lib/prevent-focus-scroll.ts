/** Mouse-down on in-page controls: focus without scrolling the page. */
export function preventFocusScroll(event: {
  preventDefault: () => void;
  currentTarget: EventTarget;
}): void {
  if (event.currentTarget instanceof HTMLSelectElement) {
    return;
  }
  event.preventDefault();
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.focus({ preventScroll: true });
  }
}
