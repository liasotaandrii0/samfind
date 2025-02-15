import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex z-100 cursor-pointer items-center rounded-full justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-primary-foreground bg-primary text-primary-foreground hover:text-primary active:shadow-[0_2px_20px_0_#B668F080] hover:bg-primary/90 gradient-border hover:bg-gradient-to-r from-[#713FA5] to-[#26123A] disabled:text-disabled disabled:border-disabled",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "border-primary-foreground bg-tetrary text-light active:shadow-[0_2px_20px_0_#B668F080] hover:bg-secondary-foreground gradient-border leading-6 active:bg-secondary-active disabled:text-disabled disabled:border-disabled",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "border-none text-primary text-2xl font-medium underline-offset-4 hover:underline [text-decoration-style:wavy] hover:text-link-hover active:text-link-active",
        tetrary:
          "border-none bg-tetrary-foreground text-primary active:shadow-[0_2px_20px_0_#B668F080] hover:bg-secondary-foreground disabled:text-disabled",
        edit: "border-none text-primary text-[16px] hover:text-disabled active:text-[#302935] ",
        saveProfile:
          "border-none bg-tetrary-foreground hover:bg-input active:bg-[#302935] text-primary text-[16px] hover:text-disabled disabled:bg-disabled",
        menuItem:
          "transition-all bg-transparent text-base text-[#A8A8A8] hover:bg-card active:bg-[#302935] active:text-white w-full justify-start",
        purple:
          "border-none bg-[#8F40E5] hover:bg-[#7636BC] active:bg-[#302935] text-primary text-[16px] disabled:bg-disabled",
      },
      size: {
        default: "px-4 py-2.5",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  withLoader?: boolean;
  leftIcon?: React.JSX.Element;
  rightIcon?: React.JSX.Element;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      leftIcon,
      rightIcon,
      withLoader,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {withLoader ? (
          <>
            {loading && (
              <LoaderCircle className="animate-spin absolute" size={18} />
            )}
            <div className={loading ? "invisible" : ""}>{props.children}</div>
          </>
        ) : (
          <>
            {leftIcon}
            {props.children}
            {rightIcon}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
