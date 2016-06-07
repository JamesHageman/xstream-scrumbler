import { Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import debounce from 'xstream/extra/debounce'
import { DOMSource } from '@cycle/dom'
import * as R from 'ramda'
import createEventHandler from '../../util/create-event-handler'
import { WebsocketSource } from '../../drivers/websocket' 
import { Position, Note, NoteMap, BootstrapMessage, State, NoteEvent } 
  from './types'
import { view } from './view'
  
interface Sources { 
  DOM: DOMSource
  websocket: WebsocketSource
}

const initialState : State = {
  boards: {},
  notes: {},
  editingNoteId: null
}

export default function Board(sources: Sources, 
  stateUpdate$: Stream<BootstrapMessage>) {
  const {
    stream: noteEditStart$,
    handler: onNoteEditStart
  } = createEventHandler<string>()
  
  const container = sources.DOM.select('.js-container')
  
  const noteEditArea = container.select('.js-note-edit')
  
  const noteMouseDown$: Stream<NoteEvent> = (container.select('.js-note')
    .events('mousedown') as Stream<MouseEvent>).map((e) => {
      return {
        id: (e.currentTarget as Element).getAttribute('data-note'),
        x: e.clientX,
        y: e.clientY
      }
    })
  
  const mouseMove$ = container
    .events('mousemove') as Stream<MouseEvent>
  const mouseUp$ = container
    .events('mouseup') as Stream<MouseEvent>
   
  const noteEditBlur$ = noteEditArea
    .events('blur') as Stream<Event>
  
  const noteSaveText$ = noteEditBlur$
    .map(e => ({
      noteId: (e.target as HTMLTextAreaElement).getAttribute('data-note'),
      text: (e.target as HTMLTextAreaElement).value
    }))
    .filter(({ noteId }) => noteId !== null && noteId.length > 0)
   
  const finishEdit$ = Stream.merge(
    container.events('click'), noteEditBlur$
  ).compose(debounce(20))
  
  const addNote$ = sources.DOM.select('.js-add-note')
    .events('click') as Stream<MouseEvent>
  
  const noteDrag$: Stream<NoteEvent> = noteMouseDown$.map(({ id }) => 
    mouseMove$.map(e => ({
      id: id,
      x: e.clientX - 30,
      y: e.clientY - 30
    }))
    .compose(dropRepeats((a: any, b: any) => 
      a.x === b.x && a.y === b.y
    ))
    .endWhen(mouseUp$)
  ).flatten()
  
  const noteDragMod$ = noteDrag$.map(({ id, x, y }) => (state: State) => {
    const update = R.set(
      R.lensPath(['notes', id, 'pos']),
      { x, y } as Position
    )
    return update(state)
  })
  
  const noteEditId$ = Stream.merge(noteEditStart$, finishEdit$.mapTo(null))
  
  const noteEditStartMod$ = noteEditId$.map(id => (state: State) => {
    if (state.editingNoteId === id) {
      return state
    }
    return R.assoc('editingNoteId', id, state) as State
  })
  
  const updateFromBootsrapMessage = (data: BootstrapMessage) => 
    R.pipe<State, State, State>(
      R.assoc('boards', data.boards),
      R.assoc('notes', data.notes)
    )
  
  // perform optimistic update
  const noteSaveTextMod$ = noteSaveText$.map(({ noteId, text }) => 
    (state: State) => {
      const update = R.set(
        R.lensPath(['notes', noteId, 'label']),
        text
      )
      return update(state)
    })
  
  const serverBootstrap$ = sources.websocket.get('bootstrap')
    .map((res: any) => res.data as BootstrapMessage).debug('bootstrap$')
  
  const serverBootstrapMod$ = 
    serverBootstrap$.map(updateFromBootsrapMessage)
    
  const stateUpdateMod$ = stateUpdate$.map(updateFromBootsrapMessage)
  
  const mod$ = Stream.merge(
    noteDragMod$, noteEditStartMod$, noteSaveTextMod$,
    serverBootstrapMod$, stateUpdateMod$
  )
  
  const state$ = mod$.fold((state, mod) => mod(state), initialState)
    .compose(dropRepeats<State>())
    .debug('state$')

  const view$ = view(state$, onNoteEditStart)
  
  const dragNoteEvent$ = mouseMove$.map(e => noteDrag$.mapTo(e)).flatten()
  
  return {
    DOM: view$,
    preventDefault: dragNoteEvent$,
    moveNote$: noteDrag$.compose(debounce<NoteEvent>(500)),
    addNote$: addNote$,
    editNote$: noteSaveText$.map(({ noteId, text }) => ({
      id: noteId,
      label: text
    }))
  }
}
