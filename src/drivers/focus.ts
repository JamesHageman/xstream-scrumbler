import { Stream } from 'xstream';

export function createFocusDriver() {
  return (selector$ : Stream<string>) => {
    selector$.addListener({
      next: selector => {
        const node = document.querySelector(selector) as HTMLElement;
        if (node) {
          node.focus()
        }
      },
      error: () => {},
      complete: () => {}
    })
    
    return {}
  }
}
