export function EmptyState({ title, description, icon: Icon, action }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 p-8 text-center animate-fade-in">
      {Icon && (
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
