import type { Selection, TextEditor } from 'vscode'
import { useLogger } from 'reactive-vscode'
import { displayName } from './generated/meta'

export const logger = useLogger(displayName)

export function selectSelection(editor: TextEditor | undefined, selection: Selection) {
  if (!editor)
    return

  editor.selection = selection
}

export function deleteSelection(editor: TextEditor | undefined, selection: Selection) {
  if (!editor)
    return

  editor.edit(editBuilder => editBuilder.delete(selection))
}
