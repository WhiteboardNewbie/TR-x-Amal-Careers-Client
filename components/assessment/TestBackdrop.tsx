import { LoaderIcon } from "./icons";

export function TestBackdrop({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amal-red/5 to-amal-blue/10">
      <div className="flex flex-col items-center gap-4 text-zinc-600">
        <LoaderIcon className="h-10 w-10 animate-spin text-amal-red" />
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}
