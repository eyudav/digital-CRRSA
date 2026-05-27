import { Button } from "@/components/ui/button";

export function FilterBar({ options, currentFilter, onFilterChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ id, label }) => {
        const isActive = currentFilter === id;
        return (
          <Button 
            key={id} 
            size="sm" 
            variant={isActive ? "default" : "outline"} 
            className={`rounded-full px-4 h-8 text-xs ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => onFilterChange(id)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
