/**
 * The Design sidebar's states, the same on every card, chip, swatch and choice, in the Admin's tokens: a hairline edge at rest,
 * the strong edge and the hover fill on hover, and the selected state in the Admin's orange (`border/active`), doubled inside, on
 * a soft orange fill (Figma 14/11: selection in the panel and the inspector is orange; only the marks on the canvas stay white).
 * Pressed shrinks a hair. 150 ms ease-out on colour, edge and scale only, and none for people who ask for less motion.
 */
export const EASE = "transition-[background-color,border-color,box-shadow,color,opacity,transform,scale] duration-150 ease-out motion-reduce:transition-none"

/** A card to pick (a layout, a font pair, a look, a width): a 1px edge at rest. */
export const CARD = `${EASE} rounded-a-lg border border-a-border outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus active:scale-[0.985] motion-reduce:active:scale-100`
export const CARD_IDLE = "hover:border-a-border-strong hover:bg-a-hover"
export const CARD_ON = "border-a-border-active bg-a-accent-soft shadow-[inset_0_0_0_1px_var(--admin-color-border-active)] hover:border-a-border-active"
export const card = (on: boolean) => `${CARD} ${on ? CARD_ON : CARD_IDLE}`

/** A chip to pick or switch on (filters, header parts). */
export const CHIP = `${EASE} rounded-full border outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus active:scale-[0.97] motion-reduce:active:scale-100`
export const CHIP_IDLE = "border-a-border text-a-text-2 hover:border-a-border-strong hover:bg-a-hover hover:text-a-text"
export const CHIP_ON = "border-a-border-active bg-a-accent-soft text-a-text"
export const chip = (on: boolean) => `${CHIP} ${on ? CHIP_ON : CHIP_IDLE}`

/** A colour swatch: grows a little on hover; the chosen one gets an orange ring outside it. */
/** `outline-solid` is needed: the swatch buttons carry `outline-none`, which would otherwise hide this outline. */
export const SWATCH_ON = "outline-solid outline-2 outline-offset-2 outline-a-border-active"
