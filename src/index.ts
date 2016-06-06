import './styles/index.css'
import { makeDOMDriver, DOMSource } from '@cycle/dom'
import Cycle from '@cycle/xstream-run'
import Board from './components/board'
import { Stream } from 'xstream'
import isolate from '@cycle/isolate'
import { createWebsocketDriver, WebsocketSource } from './drivers/websocket' 

interface Sources { 
  DOM: DOMSource, 
  websocket: WebsocketSource 
}

function main(sources: Sources) {
  const board = isolate(Board)(sources)
  
  return {
    DOM: board.DOM,
    websocket: Stream.merge(board.websocket, Stream.of({ type: 'init' })),
    preventDefault: board.preventDefault
  }
}

Cycle.run(main, {
  DOM: makeDOMDriver('#root'),
  websocket: createWebsocketDriver('http://localhost:3000'),
  preventDefault: (event$: Stream<Event>) => {
    event$.addListener({
      next: (e) => e.preventDefault(),
      error: (err) => console.error(err),
      complete: () => {}
    })
    return {}
  },
})
