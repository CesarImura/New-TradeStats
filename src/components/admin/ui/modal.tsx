"use client"

import { X } from "@/components/icons"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { AdminButton } from "./button"

type Shell = { open: boolean; onOpenChange: (o: boolean) => void; title: React.ReactNode; subtitle?: React.ReactNode; footer?: React.ReactNode; headerActions?: React.ReactNode; className?: string; bodyClassName?: string; children: React.ReactNode }

function Parts({ title, subtitle, footer, headerActions, bodyClassName, children, onClose, Title, Description }: Omit<Shell, "open" | "onOpenChange" | "className"> & { onClose: () => void; Title: React.ElementType; Description: React.ElementType }) {
  return (
    <>
      <div className="flex shrink-0 items-start gap-3 border-b border-a-border px-6 py-5">
        <div className="grid min-w-0 flex-1 gap-1">
          <Title className="t-heading-m! text-a-text">{title}</Title>
          {subtitle && <Description className="t-body-m! text-a-text-2">{subtitle}</Description>}
        </div>
        {headerActions}
        <AdminButton hierarchy="ghost" size="sm" iconOnly aria-label="Close" onClick={onClose}><X /></AdminButton>
      </div>
      <div className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5", bodyClassName)}>{children}</div>
      {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-a-border px-6 py-4">{footer}</div>}
    </>
  )
}

/** Admin / Modal (Figma 'Admin · Layout'): radius 16, strong hairline, shadow 0 30 60; header 20/24, body 20/24 gap 16, footer 16/24. */
export function AdminModal({ open, onOpenChange, className, ...p }: Shell) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn("flex max-h-[calc(100svh-2rem)] flex-col gap-0 overflow-hidden rounded-a-xl border border-a-border-strong bg-a-panel p-0 text-a-text ring-0 sm:max-w-[560px]", className)}>
        <Parts {...p} onClose={() => onOpenChange(false)} Title={DialogTitle} Description={DialogDescription} />
      </DialogContent>
    </Dialog>
  )
}

/** Admin / Drawer: the same shell as a floating right panel, 520 wide. */
export function AdminDrawer({ open, onOpenChange, className, ...p }: Shell) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false} className={cn("w-full gap-0 border-a-border-strong bg-a-panel p-0 data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:h-auto data-[side=right]:w-[calc(100%-1rem)] data-[side=right]:rounded-a-xl data-[side=right]:border sm:data-[side=right]:w-[520px] sm:max-w-none", className)}>
        <Parts {...p} onClose={() => onOpenChange(false)} Title={SheetTitle} Description={SheetDescription} />
      </SheetContent>
    </Sheet>
  )
}
