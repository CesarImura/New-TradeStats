"use client"
import { useDesign } from "./design-context"
import { FONT_LIBRARY } from "@/lib/fonts"
import { SelectionCard } from "./choice-cards"
import { Field, Segmented } from "./controls"
import { FONT_PAIRS } from "../options"

/* ---------- Type ---------- */

export function FontsField() {
  const { theme, change } = useDesign()
  return (
    <div data-field="fonts" className="grid gap-1.5">
      {/* Figma Style · 04 Type: each pair as a card that shows its heading font, the pair's name and the fonts in it. */}
      <div role="radiogroup" aria-label="Font pair" className="grid grid-cols-2 gap-2">
        {FONT_PAIRS.map((p) => {
          // The label font too: two pairs share a heading and body and differ only in their labels.
          const on = theme.fonts.heading === p.heading && theme.fonts.body === p.body && theme.fonts.label === p.label
          return (
            <SelectionCard
              key={p.name}
              checked={on}
              onSelect={() => change({ theme: { fonts: { heading: p.heading, body: p.body, label: p.label } } }, "fonts")}
              title={p.name}
              description={p.text}
              media={
                <span aria-hidden className="grid h-[69px] place-items-center rounded-a-md bg-a-sunk text-[28px] leading-8 text-a-text" style={{ fontFamily: FONT_LIBRARY[p.heading].css }}>
                  Aa
                </span>
              }
            />
          )
        })}
      </div>
    </div>
  )
}

export function HeadingWeightField() {
  const { theme, change } = useDesign()
  return (
    <Field id="heading-weight" label="Heading weight">
      <Segmented
        label="Heading weight"
        value={theme.headingWeight}
        onChange={(headingWeight) => change({ theme: { headingWeight } }, "weight")}
        options={[
          { value: 400, label: "Light" },
          { value: 500, label: "Medium" },
          { value: 700, label: "Bold" },
        ]}
      />
    </Field>
  )
}

export function LabelsField() {
  const { theme, change } = useDesign()
  return (
    <Field id="labels" label="Small labels">
      <Segmented
        label="Small labels"
        value={theme.labelStyle}
        onChange={(labelStyle) => change({ theme: { labelStyle } }, "labels")}
        options={[
          { value: "plain", label: "Normal" },
          { value: "caps", label: "UPPERCASE" },
        ]}
      />
    </Field>
  )
}
