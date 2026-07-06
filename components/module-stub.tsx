interface ModuleStubProps {
  title: string;
  phase: number;
  description?: string;
}

export function ModuleStub({ title, phase, description }: ModuleStubProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        Phase {phase}
      </span>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
