import './styles/index.css'
import { makeDOMDriver, DOMSource } from '@cycle/dom'
import Cycle from '@cycle/xstream-run'
import Board from './components/board'
import { Stream } from 'xstream'

function main(sources: { DOM: DOMSource }) {
  const board = Board(sources)
  
  return {
    DOM: board.DOM,
    preventDefault: board.preventDefault
  }
}

Cycle.run(main, {
  DOM: makeDOMDriver('#root'),
  preventDefault: (event$: Stream<Event>) => {
    event$.addListener({
      next: (e) => e.preventDefault(),
      error: (err) => console.error(err),
      complete: () => {}
    })
    return {}
  }
})
