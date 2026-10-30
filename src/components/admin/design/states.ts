/**
 * The Design sidebar's states, the same on every card, chip, swatch and choice (ts-system: orange is selection and
 * focus, never hover). Edges and fills are mixed from the foreground, so the same classes read on the dark admin
 * and on the light theme editors. Hover lifts the edge and the fill one step, in grey; selected is the orange edge, doubled
 * inside, with a faint orange wash; pressed shrinks a hair. 150ms ease-out on colour, edge and scale only, and none
 * for people who ask for less motion.
 */
export const EASE = "transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-150 ease-out motion-reduce:transition-none"

/** A card to pick (a layout, a font pair, a look, a width): a 1px edge at rest. */
export const CARD = `${EASE} rounded-lg border border-[color-mix(in_oklab,var(--foreground)_13%,transparent)] outline-none active:scale-[0.985] motion-reduce:active:scale-100`
export const CARD_IDLE = "hover:border-[color-mix(in_oklab,var(--foreground)_28%,transparent)] hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]"
export const CARD_ON = "border-[var(--ts-interactive)] bg-[rgb(255_85_0/0.06)] shadow-[inset_0_0_0_1px_var(--ts-interactive)] hover:border-[var(--ts-interactive)]"
export const card = (on: boolean) => `${CARD} ${on ? CARD_ON : CARD_IDLE}`

/** A chip to pick or switch on (filters, header parts). */
export const CHIP = `${EASE} rounded-full border outline-none active:scale-[0.97] motion-reduce:active:scale-100`
export const CHIP_IDLE = "border-[color-mix(in_oklab,var(--foreground)_13%,transparent)] text-muted-foreground hover:border-[color-mix(in_oklab,var(--foreground)_28%,transparent)] hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] hover:text-foreground"
export const CHIP_ON = "border-[var(--ts-interactive)] bg-[rgb(255_85_0/0.12)] text-foreground"
export const chip = (on: boolean) => `${CHIP} ${on ? CHIP_ON : CHIP_IDLE}`

/** A colour swatch: grows a little on hover; the chosen one gets an orange ring outside it. */
export const SWATCH_ON = "outline-2 outline-offset-2 outline-[var(--ts-interactive)]"
