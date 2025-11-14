import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

const Logo = ({ className, onClick, clickable = true }: LogoProps) => {
  const content = (
    <>
      <BrainCircuit className="h-7 w-7 text-primary" />
      <span className="text-xl font-bold tracking-tight text-foreground">
        InsightMeet
      </span>
    </>
  );

  if (clickable && onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-2 py-1 -ml-2",
          className
        )}
        aria-label="Go to home page"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {content}
    </div>
  );
};

export default Logo;
