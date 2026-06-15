import type { Segment, SlotDef } from './types'

/**
 * Parse a template string into segments.
 * Template uses ${key} syntax for slot placeholders.
 *
 * @example
 * parseTemplate('${component}被点击', { component: { label: '指定组件', tools: ['picker'] } })
 * // → [{ type:'slot', key:'component', label:'指定组件', tools:['picker'], value:null }, { type:'text', content:'被点击' }]
 */
export function parseTemplate(
  template: string,
  slots: Record<string, SlotDef> = {},
  slotValues: Record<string, unknown> = {}
): Segment[] {
  const segments: Segment[] = []
  const regex = /\$\{(\w+)\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: template.slice(lastIndex, match.index) })
    }

    const key = match[1]
    const slotDef = slots[key]

    if (slotDef) {
      segments.push({
        type: 'slot',
        key,
        label: slotDef.label,
        tools: slotDef.tools,
        value: slotValues[key] ?? null
      })
    }
    else {
      // Unknown slot key, treat as text
      segments.push({ type: 'text', content: match[0] })
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < template.length) {
    segments.push({ type: 'text', content: template.slice(lastIndex) })
  }

  return segments
}
