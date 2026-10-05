/** Mouse-down on in-page tabs: keep focus from scrolling the page. */
export function preventFocusScroll(event: { preventDefault: () => void }): void {
  event.preventDefault();
}
