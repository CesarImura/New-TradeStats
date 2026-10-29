"use client"

// The project accordion's look on Animate UI's Base UI accordion: the panel's height animates with Motion.
import { Accordion as AccordionPrimitive } from "@animate-ui/react/primitives/base-ui/accordion"
import { ChevronDownIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" className={cn("flex w-full flex-col", className)} {...props} />
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("not-last:border-b", className)} {...props} />
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 cursor-pointer items-start justify-between gap-3 rounded-lg text-left text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-aria-expanded/accordion-trigger:rotate-180 motion-reduce:transition-none" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Panel>) {
  return (
    <AccordionPrimitive.Panel data-slot="accordion-content" className="overflow-hidden text-sm" transition={{ type: "tween", duration: 0.22, ease: "easeOut" }} {...props}>
      <div className={cn("pt-0 pb-2.5", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
