import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import type { CoachTheme, TemplateId } from "@/lib/theme/types"
import type { TemplateDef, TemplatePage } from "@/lib/theme/templates"
import type { PageId, WidgetInstance } from "@/lib/widgets/layout"

/**
 * Prototype only: "Save as template" in Design writes the design into
 * src/lib/theme/template-data.json, so templates can be designed in the
 * editor instead of by hand. Off outside `next dev`. Git keeps the old file.
 */
const FILE = path.join(process.cwd(), "src/lib/theme/template-data.json")

type Body = { id: TemplateId; name?: string; blurb?: string; theme: CoachTheme; pages: Partial<Record<PageId, { items: WidgetInstance[] }>> }

/** A widget as the template stores it: no id, no empty fields. */
const clean = (w: WidgetInstance) => Object.fromEntries(Object.entries(w).filter(([k, v]) => k !== "id" && v !== undefined && v !== null)) as TemplatePage["items"][number]

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 })
  const body = (await request.json()) as Body
  const data = JSON.parse(await readFile(FILE, "utf8")) as Record<string, TemplateDef>
  const old = data[body.id]
  if (!old) return Response.json({ error: `Unknown template "${body.id}"` }, { status: 400 })
  if (!body.theme?.palettes || !body.pages?.home) return Response.json({ error: "A theme with palettes and a Home layout are required" }, { status: 400 })

  const pages = Object.fromEntries(Object.entries(body.pages).map(([page, l]) => [page, { items: (l?.items ?? []).map(clean) }]))
  data[body.id] = {
    name: body.name?.trim() || old.name,
    blurb: body.blurb?.trim() || old.blurb,
    theme: { ...body.theme, template: body.id },
    pages,
  }
  await writeFile(FILE, JSON.stringify(data, null, 2) + "\n")
  return Response.json({ ok: true, file: "src/lib/theme/template-data.json", template: body.id, pages: Object.keys(pages), widgets: Object.values(pages).reduce((n, l) => n + l.items.length, 0) })
}
