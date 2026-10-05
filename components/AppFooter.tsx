export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="overflow-anchor-none border-t border-zinc-200 bg-amal-white/80 backdrop-blur-sm">
      <div className="mx-auto max-w-[1600px] px-4 py-4">
        <p className="text-center text-xs font-medium text-zinc-500">
          ⓒ {currentYear} Amal Academy. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
