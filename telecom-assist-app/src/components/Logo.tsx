import logo from "@/assets/tt-icon-Photoroom.png";

interface Props {
  variant?: "light" | "dark";
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function Logo({ variant = "dark", size = 40, showWordmark = true, className = "" }: Props) {
  const textColor = variant === "light" ? "text-white" : "text-foreground";
  const sub = variant === "light" ? "text-white/60" : "text-muted-foreground";
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="shrink-0"
        style={{ width: size, height: size }}
      >
        <img src={logo} alt="Tunisie Telecom" className="h-full w-full object-contain" />
      </div>
      {showWordmark && (
        <div className="leading-tight">
          <div className={`font-display font-bold text-base ${textColor}`}>Smart Mail</div>
          <div className={`text-[10px] tracking-[0.18em] uppercase ${sub}`}>TUNISIE TELECOM</div>
        </div>
      )}
    </div>
  );
}
