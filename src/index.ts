import { computed, defineExtension, useActiveTextEditor, useCommand, useDocumentText, useTextEditorSelection } from 'reactive-vscode'
import { commands } from './generated/meta'
import { useParser } from './parser'
import { fnHandler, type Handler } from './rules/fn'
import { deleteSelection, selectSelection } from './utils'

const { activate, deactivate } = defineExtension(() => {
  const editor = useActiveTextEditor()
  const doc = computed(() => editor.value?.document)
  const text = useDocumentText(doc)
  const editorSelection = useTextEditorSelection(editor)

  function trigger(handler: Handler) {
    if (
      !editor.value
      || !doc.value
      || !text.value
      || !editorSelection.value
    ) {
      return
    }

    const res = useParser({
      langId: doc.value.languageId,
      raw: text.value,
    })

    if (!res)
      return

    // logger.info('res', JSON.stringify(res, null, 2))

    return handler({
      ...res,
      selection: editorSelection.value,
      doc: doc.value,
    })
  }

  useCommand(commands.fastCodeSelectorFnSelect, () => {
    // TODO: improve type
    const { expression } = trigger(fnHandler) || {}
    if (expression)
      selectSelection(editor.value, expression)
  })

  useCommand(commands.fastCodeSelectorFnDelete, () => {
    const { expression } = trigger(fnHandler) || {}
    if (expression)
      deleteSelection(editor.value, expression)
  })

  useCommand(commands.fastCodeSelectorFnBodySelect, () => {
    const { body } = trigger(fnHandler) || {}
    if (body)
      selectSelection(editor.value, body)
  })

  useCommand(commands.fastCodeSelectorFnBodyDelete, () => {
    const { body } = trigger(fnHandler) || {}
    if (body)
      deleteSelection(editor.value, body)
  })

  useCommand(commands.fastCodeSelectorFnReturnSelect, () => {
    const { returnStatement } = trigger(fnHandler) || {}
    if (returnStatement)
      selectSelection(editor.value, returnStatement)
  })

  useCommand(commands.fastCodeSelectorFnReturnDelete, () => {
    const { returnStatement } = trigger(fnHandler) || {}
    if (returnStatement)
      deleteSelection(editor.value, returnStatement)
  })
})

export { activate, deactivate }
