import { Stream, Producer, Listener } from 'xstream'

export default function createEventHandler<T>() {
  interface HandlerProducer<T> extends Producer<T> {
    sendValue: (T) => void,
    _listener: Listener<T>
  }
  
  const producer: HandlerProducer<T> = {
    start(listener) {
      this._listener = listener
    },
    stop() {
      this._listener = null
    },
    sendValue(val: T) {
      if (this._listener) {
        this._listener.next(val)
      }
    },
    _listener: null as Listener<T>
  }
  
  const stream = Stream.create(producer)
  
  return {
    stream,
    handler: (val: T) => {
      producer.sendValue(val)
    }
  }
}
