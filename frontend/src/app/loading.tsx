import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center flex-col gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Carregando a página...</p>
    </div>
  );
}
