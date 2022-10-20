import React from 'react'
import renderer from 'react-test-renderer'
import * as reactTest from '@testing-library/react'
import { Application } from '@pixi/app'
import { Container as PixiContainer } from '@pixi/display'
import { Renderer as PixiRenderer } from '@pixi/core'
import { PixiFiber } from '../src'
import { Container, Stage } from '../src'
import { Context } from '../src/provider'
import { getCanvasProps } from '../src/stage'
import { mockToSpy } from './__utils__/mock'
import { ConcurrentRoot } from 'react-reconciler/constants'

const act = React.unstable_act

jest.mock('../src/reconciler')
jest.useFakeTimers()

describe('stage', () => {
  beforeEach(() => {
    window.matchMedia.mockClear()
    jest.clearAllMocks()
    mockToSpy('../src/reconciler')
  })

  test('filter out reserved props from getCanvasProps', () => {
    const props = {
      children: [],
      options: { foo: 'bar', bar: 'foo' },
      raf: true,
      onMount: () => {},
      width: 100,
      height: 400,
    }
    expect(getCanvasProps(props)).toEqual({})
  })

  test('prop types', () => {
    expect(Stage.propTypes).toMatchSnapshot()
    expect(Stage.defaultProps).toMatchSnapshot()
  })

  test('renders a canvas element', () => {
    let el
    act(() => (el = renderer.create(<Stage />)))
    const tree = el.toJSON()
    expect(tree).toHaveProperty('type', 'canvas')
    expect(tree).toMatchSnapshot()
  })

  test('renders null if view is passed in options', () => {
    const options = {
      view: document.createElement('canvas'),
    }
    let el
    act(() => (el = renderer.create(<Stage options={options} />)))
    const tree = el.toJSON()
    expect(tree).toBeNull()
  })

  test('use autoDensity by default', () => {
    const renderAutoDensity = options => {
      let el
      act(
        () =>
          (el = renderer.create(
            <Stage
              options={{
                view: document.createElement('canvas'),
                ...options,
              }}
            />
          ))
      )

      return el.getInstance().app.renderer.options.autoDensity
    }

    expect(renderAutoDensity({})).toBeTruthy()
    expect(renderAutoDensity({ autoDensity: false })).toBeFalsy()
  })

  test('validate options.view', () => {
    const options = { view: 123 }

    expect(() => {
      let tree
      act(() => (tree = renderer.create(<Stage options={options} />)))
      return tree.toJSON()
    }).toThrow('options.view needs to be a `HTMLCanvasElement`')
  })

  test('passes options.view to PIXI.Application', () => {
    const view = document.createElement('canvas')
    let el
    act(() => (el = renderer.create(<Stage options={{ view }} />)))
    const app = el.getInstance().app

    expect(app.view).toBe(view)
  })

  test('passes props to canvas element', () => {
    const id = 'stage'
    const className = 'canvas__element'
    const style = { border: '1px solid red' }
    const dataAttr = 'something'
    let el
    act(() => (el = renderer.create(<Stage className={className} id={id} style={style} data-attr={dataAttr} />)))
    const tree = el.toJSON()
    expect(tree.props).toEqual({ className, id, style, 'data-attr': dataAttr })
  })

  test('does not pass reserved props to renderer canvas element', () => {
    const options = { backgroundColor: 0xff0000 }
    let el
    act(() => (el = renderer.create(<Stage height={500} width={500} options={options} />)))
    const tree = el.toJSON()
    expect(tree).toHaveProperty('type', 'canvas')
    expect(tree.props).toEqual({})
  })

  test('creates a PIXI.Application with passed options', () => {
    let el
    act(() => (el = renderer.create(<Stage width={100} height={50} options={{ backgroundColor: 0xff0000 }} />)))
    const app = el.getInstance().app

    expect(app.stage).toBeInstanceOf(PixiContainer)
    expect(app).toBeInstanceOf(Application)
    expect(app.renderer.options).toMatchObject({
      backgroundColor: 0xff0000,
      width: 100,
      height: 50,
    })
  })

  test('resize renderer when dimensions change', () => {
    let el
    act(() => (el = renderer.create(<Stage width={100} height={100} />)))
    const app = el.getInstance().app

    expect(app.renderer).toHaveProperty('width', 100)
    expect(app.renderer).toHaveProperty('height', 100)

    act(() => el.update(<Stage width={1000} height={100} />))
    expect(app.renderer).toHaveProperty('width', 1000)
    expect(app.renderer).toHaveProperty('height', 100)

    act(() => el.update(<Stage width={1000} height={1000} />))
    expect(app.renderer).toHaveProperty('width', 1000)
    expect(app.renderer).toHaveProperty('height', 1000)

    act(() => el.update(<Stage width={100} height={100} />))

    expect(app.renderer).toHaveProperty('width', 100)
    expect(app.renderer).toHaveProperty('height', 100)
  })

  test('call onMount()', () => {
    const spy = jest.fn()
    act(() => renderer.create(<Stage onMount={spy} />))

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]).toHaveLength(1)
    expect(spy.mock.calls[0][0]).toBeInstanceOf(Application)
  })

  test('can be unmounted', () => {
    let el
    act(() => (el = renderer.create(<Stage />)))
    const instance = el.getInstance()

    jest.spyOn(instance, 'componentWillUnmount')

    act(() => el.unmount())
    expect(instance.componentWillUnmount).toBeCalled()
  })

  test('destroys application on unmount', () => {
    let el
    act(() => (el = renderer.create(<Stage />)))
    const instance = el.getInstance()

    const app = instance.app
    jest.spyOn(app, 'destroy')

    act(() => el.unmount())
    expect(app.destroy).toBeCalled()
  })

  test('call PixiFiber.createContainer on componentDidMount', () => {
    let el
    act(() => (el = renderer.create(<Stage />)))
    const stage = el.getInstance().app.stage

    expect(PixiFiber.createContainer).toHaveBeenCalledTimes(1)
    expect(PixiFiber.createContainer).toHaveBeenCalledWith(stage, ConcurrentRoot, null, false)
  })

  test('call PixiFiber.updateContainer on componentDidMount', () => {
    let el
    act(
      () =>
        (el = renderer.create(
          <Stage>
            <Container width={10} />
          </Stage>
        ))
    )
    const instance = el.getInstance()
    expect(PixiFiber.updateContainer).toHaveBeenCalledTimes(1)
    expect(PixiFiber.updateContainer).toHaveBeenCalledWith(
      <Context.Provider value={instance.app}>
        <Container width={10} />
      </Context.Provider>,
      expect.anything(),
      undefined
    )
  })

  test('call PixiFiber.updateContainer on componentDidUpdate', () => {
    let el
    act(() => (el = renderer.create(<Stage />)))

    PixiFiber.updateContainer.mockClear()
    act(() => act(() => el.update(<Stage />)))
    expect(PixiFiber.updateContainer).toHaveBeenCalledTimes(1)
  })

  test('call PixiFiber.updateContainer on componentWillUnmount', () => {
    let el
    act(() => (el = renderer.create(<Stage />)))
    const instance = el.getInstance()

    PixiFiber.updateContainer.mockClear()
    act(() => el.unmount())

    jest.advanceTimersByTime(1000)

    expect(PixiFiber.updateContainer).toHaveBeenCalledTimes(1)
    expect(PixiFiber.updateContainer).toHaveBeenCalledWith(null, expect.anything(), undefined, expect.anything())
  })

  describe('pixi application', () => {
    test('ticker running on mount', () => {
      let el
      act(() => (el = renderer.create(<Stage />)))
      const app = el.getInstance().app
      expect(app.ticker.started).toBeTruthy()
    })

    test('ticker not running on mount with prop raf to false', () => {
      let el
      act(() => (el = renderer.create(<Stage raf={false} />)))
      const app = el.getInstance().app
      expect(app.ticker.started).toBeFalsy()
    })

    test('ticker to be toggable', () => {
      let el
      act(() => (el = renderer.create(<Stage raf={false} />)))
      const app = el.getInstance().app
      expect(app.ticker.started).toBeFalsy()

      act(() => act(() => el.update(<Stage raf={true} />)))
      expect(app.ticker.started).toBeTruthy()

      act(() => act(() => el.update(<Stage raf={false} />)))
      expect(app.ticker.started).toBeFalsy()
    })

    test('render stage on component update with raf to false', () => {
      let el
      act(() => (el = renderer.create(<Stage raf={false} />)))
      const app = el.getInstance().app

      jest.spyOn(app.renderer, 'render')

      act(() => act(() => el.update(<Stage raf={false} />)))
      expect(app.renderer.render).toHaveBeenCalledTimes(0)

      act(() => act(() => el.update(<Stage raf={false} options={{ backgroundColor: 0xff0000 }} />)))
      expect(app.renderer.render).toHaveBeenCalledTimes(1)
    })

    test('not render stage on component update with renderOnComponentChange to false', () => {
      let el
      act(() => (el = renderer.create(<Stage raf={false} renderOnComponentChange={false} />)))
      const app = el.getInstance().app

      jest.spyOn(app.renderer, 'render')
      act(() => act(() => el.update(<Stage raf={false} renderOnComponentChange={false} />)))
      expect(app.renderer.render).not.toHaveBeenCalled()
    })

    test('render stage on reconciliation `commitUpdate` using `renderOnComponentChange` to true', () => {
      let el
      act(
        () =>
          (el = renderer.create(
            <Stage raf={false} renderOnComponentChange={true}>
              <Container width={10} />
            </Stage>
          ))
      )

      const app = el.getInstance().app
      const ticker = el.getInstance()._ticker
      const spy = jest.spyOn(app.renderer, 'render')

      for (let i = 1; i <= 10; i++) {
        act(() =>
          el.update(
            <Stage raf={false} renderOnComponentChange={true}>
              <Container x={i} width={11} />
            </Stage>
          )
        )
        ticker.update()
        jest.runOnlyPendingTimers()
      }

      expect(spy).toBeCalledTimes(10)
    })
  })

  describe('resolution', () => {
    test('app.resolution fallback to devicePixelRatio', () => {
      window.devicePixelRatio = 3

      let el
      act(() => (el = renderer.create(<Stage />)))
      expect(el.getInstance().app.renderer.resolution).toEqual(3)
    })

    test('styles on canvas should not exist if `autoDensity` is false', () => {
      const { unmount, container } = reactTest.render(
        <Stage width={800} height={600} options={{ autoDensity: false }} />
      )
      expect(container.firstChild.getAttribute('style')).toEqual(null)
      unmount()
    })

    test('set styles on canvas if `autoDensity` is set', () => {
      const { unmount, container } = reactTest.render(
        <Stage width={800} height={600} options={{ autoDensity: true }} />
      )

      expect(container.firstChild.getAttribute('style')).toEqual('width: 800px; height: 600px;')
      unmount()
    })

    test('setup resolution media query', () => {
      expect(window.matchMedia).not.toHaveBeenCalled()

      let el
      act(() => (el = renderer.create(<Stage width={800} height={600} options={{ autoDensity: true }} />)))

      expect(el.getInstance()._mediaQuery.addListener).toHaveBeenCalled()
      expect(window.matchMedia).toHaveBeenCalledTimes(1)
    })

    test('bypass resolution media query if `resolution` is set', () => {
      let el
      act(
        () => (el = renderer.create(<Stage width={800} height={600} options={{ autoDensity: true, resolution: 1 }} />))
      )
      expect(el.getInstance()._mediaQuery).toEqual(null)
    })

    test('update renderer resolution on `options.resolution` change', () => {
      let el
      act(() => (el = renderer.create(<Stage width={800} height={600} options={{ resolution: 1 }} />)))

      const appRenderer = el.getInstance().app.renderer
      const spyResize = jest.spyOn(appRenderer, 'resize')

      act(() => (el = act(() => el.update(<Stage width={800} height={600} options={{ resolution: 2 }} />))))
      expect(appRenderer.plugins.interaction.resolution).toEqual(2)
      expect(spyResize).toHaveBeenCalledWith(800, 600)
      expect(appRenderer.resolution).toEqual(2)
    })

    test('does not update resolution of interaction plugin if interaction plugin is removed', () => {
      const interaction = PixiRenderer.__plugins.interaction
      delete PixiRenderer.__plugins.interaction

      let el
      act(() => (el = renderer.create(<Stage width={800} height={600} options={{ resolution: 1 }} />)))

      const appRenderer = el.getInstance().app.renderer
      const spyResize = jest.spyOn(appRenderer, 'resize')

      expect(() => {
        act(() => (el = act(() => el.update(<Stage width={800} height={600} options={{ resolution: 2 }} />))))
      }).not.toThrow()
      expect(spyResize).toHaveBeenCalledWith(800, 600)
      expect(appRenderer.resolution).toEqual(2)

      PixiRenderer.__plugins.interaction = interaction
    })

    test('clean up media query on unmount', () => {
      let el
      act(
        () =>
          (el = renderer.create(
            <div>
              <Stage width={800} height={600} options={{ autoDensity: true }} />
            </div>
          ))
      )

      const app = el.toTree().rendered[0].instance
      const spyDestroy = jest.spyOn(app._mediaQuery, 'removeListener')

      expect(app._mediaQuery).not.toEqual(null)

      act(() => (el = act(() => el.update(<div />))))
      expect(spyDestroy).toHaveBeenCalled()
      expect(app._mediaQuery).toEqual(null)
    })

    test('switch resolution if `autoDensity` is on without setting `resolution` specifically', () => {
      let app
      let mq
      let el

      const validate = res => {
        window.devicePixelRatio = res
        mq()
        expect(app.renderer.resolution).toEqual(res)
        expect(app.view.getAttribute('style')).toEqual('width: 800px; height: 600px;')
        expect(app.view.width).toEqual(800 * res)
        expect(app.view.height).toEqual(600 * res)
      }

      act(() => (el = renderer.create(<Stage width={800} height={600} options={{ autoDensity: true }} />)))
      app = el.getInstance().app
      mq = el.getInstance()._mediaQuery.addListener.mock.calls[0][0] //?

      for (let i = 1; i <= 10; i++) {
        validate(i)
      }
    })
  })
})
