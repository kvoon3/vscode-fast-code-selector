import { parseHTML } from './html'
import { parseJS } from './javascript'

const parsers = [
  parseJS,
  parseHTML,
]

export interface ParserContext {
  langId: string
  raw: string
  start?: number
}

export type ParserRes = ReturnType<typeof parseJS>

export function useParser(ctx: ParserContext) {
  for (const parser of parsers) {
    const result = parser(ctx)
    if (result)
      return result
  }
}
