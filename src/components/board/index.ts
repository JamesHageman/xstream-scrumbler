import { Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import debounce from 'xstream/extra/debounce'
import { div, p, textarea, section, button, DOMSource } from '@cycle/dom'
import isolate from '@cycle/isolate'
import * as R from 'ramda'
import createEventHandler from '../../util/create-event-handler'

interface Board {
  name: string
}

interface Position {
  x: number
  y: number
}

interface Note {
  pos: Position
  label: string
  id: string
}

interface NoteMap {[id: string]: Note}

interface State {
  boards: {
    [id: string]: Board
  }
  notes: NoteMap,
  editingNodeId: string
}

interface Sources { 
  DOM: DOMSource 
}

interface NoteEvent {
  id: string
  x: number
  y: number
}

const INITIAL_NOTE_POS = {
  x: 115, 
  y: 425
}

const initialState : State = {
  boards: {
    0: { name: 'Winds' },
    1: { name: 'Anchors' }, 
    2: { name: 'Action Items' }
  },
  notes: {
    1: {
      pos: { x: 100, y: 100 }, 
      label: 'Unidirectional Dataflow!', 
      id: '1'
    }
  },
  editingNodeId: null
}

const boardStyle = {
  'width': '800px',
  'position': 'relative'
}

const columnStyle = {
  'border-color': 'grey',
  'flex-grow': '1',
  'min-height': '400px',
}

const noteStyle = (note: Note) => ({
  'width': '60px',
  'height': '60px',
  'position': 'absolute',
  'cursor': 'pointer',
  'top': '0px',
  'left': '0px',
  'background-color': 'white',
  'transform': `translate3d(${note.pos.x}px, ${note.pos.y}px, 0px)`,
})

const getNextNoteId = R.pipe
  <NoteMap, Note[], string[], string[], string, string>(
  R.values,
  R.map<Note, string>(note => note.id),
  R.sortBy(id => id),
  R.last,
  (id) => (parseInt(id, 10) + 1).toString()
)

const stopPropagation = (e: MouseEvent) => {
  e.stopPropagation()
}

function Board(sources: Sources) {
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
  
  const addNoteMod$ = addNote$.mapTo((state: State) => {
    const newId = getNextNoteId(state.notes)
    
    const update = R.set(
      R.lensPath(['notes', newId]),
      { id: newId, pos: INITIAL_NOTE_POS, label: '' } as Note
    )
    
    return update(state)
  })
  
  const noteDrag$ = noteMouseDown$.map(({ id }) => 
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
    if (state.editingNodeId === id) {
      return state
    }
    return R.assoc('editingNodeId', id, state) as State
  })
  
  const noteSaveTextMod$ = noteSaveText$.map(({ noteId, text }) => 
    (state: State) => {
      const update = R.set(
        R.lensPath(['notes', noteId, 'label']),
        text
      )
      return update(state)
    })
  
  const mod$ = Stream.merge(
    noteDragMod$, addNoteMod$, noteEditStartMod$, noteSaveTextMod$
  )
  
  const state$ = mod$.fold((state, mod) => mod(state), initialState)
    .compose(dropRepeats<State>())
    .debug('state$')

  const view$ = state$.map(state => section('.js-container.p1', [ 
    div('.clearfix.flex.mb1', 
      { style: boardStyle }, 
      R.values(state.boards).map(board => 
        div('.p1.border-left.border.right.border-bottom.mx-auto', 
          { style: columnStyle }, [ 
          p('.center.m0', [ board.name ]) 
        ])
      )
    ),
    
    div('.p1', [
      button('.js-add-note', [ 'Add a note' ])
    ]),
    
    ...R.values(state.notes).map(note => 
      div('.js-note.border', { 
        style: noteStyle(note),
        attrs: { 'data-note': note.id },
      }, [ 
        state.editingNodeId === note.id ? 
          textarea('.js-note-edit', { 
            attrs: { autofocus: true, 'data-note': note.id },
            props: { onclick: stopPropagation }
          }, [note.label]) 
        : 
          div([
            note.label,
            button({
              props: {
                onmousedown: stopPropagation,
                onclick: (e) => {
                  e.stopPropagation()
                  onNoteEditStart(note.id)
                }  
              }
            }, [ 'edit' ])
          ]),
      ])
    ) 
      
  ]))
  
  const dragNoteEvent$ = mouseMove$.map(e => noteDrag$.mapTo(e)).flatten()
  
  return {
    DOM: view$,
    preventDefault: dragNoteEvent$
  }
}

export default (sources: Sources) => isolate(Board)(sources)
