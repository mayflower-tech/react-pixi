import { Application } from '@pixi/app'
import { Container as PixiContainer } from '@pixi/display'
import React from 'react'
import { roots } from '../src/render'
import { createRoot, Container } from '../src'

const act = React.unstable_act

jest.useFakeTimers()

const app = new Application()
const element = () => <Container width={10} />

describe('unmount render', () => {
  test('remove root', () => {
    expect(roots.size).toBe(0)

    const root = createRoot(new PixiContainer())
    expect(roots.size).toBe(1)

    act(() => root.render(element))
    expect(roots.size).toBe(1)

    act(() => root.unmount())
    expect(roots.size).toBe(0)
  })

  test('unmount component', () => {
    const unmount = jest.fn()
    const root = createRoot(new PixiContainer())

    const App = () => {
      React.useEffect(() => unmount)
      return null
    }

    act(() => root.render(<App />))

    act(() => root.unmount())
    jest.advanceTimersByTime(1000)

    expect(unmount).toBeCalledTimes(1)
  })
})
