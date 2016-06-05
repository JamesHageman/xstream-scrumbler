import './styles/index.css';
import { Stream } from 'xstream'
import { makeDOMDriver, DOMSource, h1 } from '@cycle/dom'
import Cycle from '@cycle/xstream-run'

function main(sources: { DOM: DOMSource }) {
  const click$ : Stream<MouseEvent> = sources.DOM.events('click')
  const count$ = click$.mapTo(1).fold((acc, curr) => acc + curr, 0)
  
  return {
    DOM: count$.map(count => h1([ 'Clicked ' + count + ' times' ]))
  }
}

Cycle.run(main, {
  DOM: makeDOMDriver('#root')
})
