import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const selectVariants = cva(
  "relative inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface SelectProps
  extends React.HTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {
  value?: string; // Make value optional for uncontrolled cases
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  asChild?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, size, asChild = false, value, onChange, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "select";

    //Handle value and onChange only if Comp is select
    const selectProps = Comp === "select" ? {value, onChange} : {};

    return (
      <Comp
        className={cn(selectVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        {...selectProps}
      >
          {children}
      </Comp>
    );
  }
);

Select.displayName = "Select";

export { Select, selectVariants };