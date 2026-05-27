import { Link } from "react-router-dom";
export function Logo({ variant = "dark" }) {
    const tone = variant === "light" ? "text-background" : "text-foreground";
    const accent = variant === "light" ? "text-accent" : "text-primary";
    return (
      <Link to="/" className={`group inline-flex items-center gap-2.5 ${tone}`}>
        <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg shadow-soft transition-transform group-hover:scale-105 bg-background dark:bg-muted border border-border">
          <img src="/crrsa-logo.png" alt="Digital CRRSA logo" className="h-full w-full object-cover dark:brightness-110"/>
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-semibold tracking-tight">
            Digital <span className={accent}>CRRSA</span>
          </span>
          <span className={`text-[10px] uppercase tracking-[0.18em] ${variant === "light" ? "text-background/60" : "text-muted-foreground"}`}>
            Civil Registration
          </span>
        </span>
      </Link>
    );
}
