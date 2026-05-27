import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        className="pl-9 h-10 rounded-xl"
      />
    </div>
  );
}
