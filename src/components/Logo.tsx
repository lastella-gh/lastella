import logo from "@/assets/lastella-logo.png";

export function Logo({ className = "h-10" }: { className?: string }) {
  return <img src={logo} alt="Lastella" className={className} />;
}

