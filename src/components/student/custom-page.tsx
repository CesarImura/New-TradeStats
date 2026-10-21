"use client"

import { useCoach } from "@/components/coach/coach-provider"
import { Placeholder } from "@/components/prototype/placeholder"
import { WidgetPage } from "@/components/student/widget-page"

/** A page the coach added to the menu; an id the coach doesn't have shows the "not built" notice. */
export function CustomPageView({ id }: { id: string }) {
  const { coach } = useCoach()
  if (!coach.customPages?.some((p) => p.id === id)) return <Placeholder area="student" section={id} />
  return <WidgetPage page={`page:${id}`} />
}
