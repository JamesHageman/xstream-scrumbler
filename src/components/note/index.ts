import { DOMSource, VNode } from '@cycle/dom'
import { Stream } from 'xstream'
import { Note, NoteState } from './types'
import view from './view'
import * as R from 'ramda'

type Sources = {
  DOM: DOMSource,
  reset$: Stream<Note>
}

type Sinks = {
  DOM: Stream<VNode>
  note$: Stream<Note>
}

const initialState = {
  note: {
    id: '0',
    label: 'sadf',
    pos: { x: 100, y: 100 }
  },
  isEditing: false,
  isDragging: false,
}

type Reducer = (state: NoteState) => NoteState

const setIsEditing = (value: boolean): Reducer =>
  R.assoc('isEditing', value)

const setNote = (note: Note): Reducer =>
  R.assoc('note', note)

function Note(sources: Sources): Sinks {

  const editStart$ = sources.DOM.select('.js-edit-btn')
    .events('click') as Stream<MouseEvent>
  const editFinish$ = sources.DOM.select('.js-note-edit')
    .events('blur') as Stream<Event>


  const editFinishMod$: Stream<Reducer> = editFinish$.map((e: Event) => {
    return R.compose<NoteState, NoteState, NoteState>(
      R.assoc('isEditing', false),
      R.set(
        R.lensPath(['note', 'label']),
        (e.target as HTMLTextAreaElement).value
      )
    )
  })

  const resetMod$ = sources.reset$.map(setNote)

  const mod$: Stream<Reducer> = Stream.merge(
    editStart$.mapTo(setIsEditing(true)),
    editFinishMod$,
    resetMod$
  )

  const state$: Stream<NoteState> = mod$.fold(
    (state, modFn) => modFn(state),
    initialState
  )

  const view$ = view(state$)

  return {
    DOM: view$,
    note$: state$.map(({ note }) => note),
  }
}

export default Note
