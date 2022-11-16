import React, { createRef, Suspense } from 'react'
import * as PIXI from 'pixi.js'
import { createRoot } from '../src/render'
import hostconfig from '../src/reconciler/hostconfig'
import { createElement } from '../src/utils/element'
import { Container, Text } from '../src'
import { getCall, mockToSpy } from './__utils__/mock'

jest.mock('../src/reconciler/hostconfig')

const act = React.unstable_act

describe('reconciler', () => {
  let container = new PIXI.Container()
  let container1 = new PIXI.Container()
  let container2 = new PIXI.Container()
  container.root = true
  container1.root = true
  container2.root = true

  let root
  let root1
  let root2
  const renderInContainer = comp => root.render(comp)
  const renderInContainer1 = comp => root1.render(comp)
  const renderInContainer2 = comp => root2.render(comp)

  beforeEach(() => {
    jest.clearAllMocks()
    mockToSpy('../src/reconciler/hostconfig')
    root = createRoot(container)
  })

  afterEach(() => {
      act(() => root.unmount())
  })

  describe('single render', () => {
    test('create instances', () => {
      act(() =>
        renderInContainer(
          <Container x={0} y={0}>
            <Text text="foo" />
          </Container>
        )
      )

      const m = getCall(hostconfig.createInstance)

      expect(m.fn).toHaveBeenCalledTimes(2)
      expect(m.all.map(([ins]) => ins)).toEqual(['Text', 'Container'])

      const text = m(0)
      expect(text.args[1]).toEqual({ text: 'foo' })
      expect(text.args[2]).toBeInstanceOf(PIXI.Container)

      const container = m(1).args[1]
      expect(container).toHaveProperty('x', 0)
      expect(container).toHaveProperty('y', 0)
      expect(container).toHaveProperty('children')
      expect(container.children.type).toEqual('Text')
    })

    test('append children', () => {
      act(() =>
        renderInContainer(
          <Container>
            <Text text="bar" />
          </Container>
        )
      )

      const m = getCall(hostconfig.appendInitialChild)
      expect(m.fn).toHaveBeenCalledTimes(1)
      expect(m(0).args[0]).toBeInstanceOf(PIXI.Container)
      expect(m(0).args[1]).toBeInstanceOf(PIXI.Text)
    })

    test('PIXI elements', () => {
      act(() =>
        renderInContainer(
          <Container x={10} y={100} pivot={'0.5,0.5'}>
            <Text text="foobar" />
          </Container>
        )
      )

      const m = getCall(hostconfig.appendInitialChild)(0)

      const container = m.args[0]
      expect(container.x).toEqual(10)
      expect(container.y).toEqual(100)
      expect(container.pivot.x).toEqual(0.5)
      expect(container.pivot.y).toEqual(0.5)

      const text = m.args[1]
      expect(text.text).toEqual('foobar')
    })
  })

  describe('rerender', () => {
    test('remove children', () => {
      act(() =>
        renderInContainer(
          <Container>
            <Text text="one" />
            <Text text="two" />
            <Text text="three" />
          </Container>
        )
      )

      act(() =>
        renderInContainer(
          <Container>
            <Text text="one" />
          </Container>
        )
      )

      const m = getCall(hostconfig.removeChild)
      expect(m.fn).toHaveBeenCalledTimes(2)
      expect(m.all.map(([_, ins]) => ins.text)).toEqual(['two', 'three'])
    })

    test('remove sub children', () => {
      const a = createRef()
      const b = createRef()
      const c = createRef()
      const d = createRef()

      act(() =>
        renderInContainer(
          <Container>
            <Container>
              <Text ref={a} />
              <Text ref={b} />
              <Text ref={c} />
              <Text ref={d} />
            </Container>
          </Container>
        )
      )

      // assign willUnmounts
      const spyA = (a.current['willUnmount'] = jest.fn())
      const spyB = (b.current['willUnmount'] = jest.fn())
      const spyC = (c.current['willUnmount'] = jest.fn())
      const spyD = (d.current['willUnmount'] = jest.fn())

      act(() => renderInContainer(<Container />))

      expect(spyA).toHaveBeenCalled()
      expect(spyB).toHaveBeenCalled()
      expect(spyC).toHaveBeenCalled()
      expect(spyD).toHaveBeenCalled()
    })

    test('insert before', () => {
      act(() =>
        renderInContainer(
          <Container>
            <Text key={1} text="one" />
            <Text key={3} text="three" />
          </Container>
        )
      )

      act(() =>
        renderInContainer(
          <Container>
            <Text key={1} text="one" />
            <Text key={2} text="two" />
            <Text key={3} text="three" />
          </Container>
        )
      )

      const m = getCall(hostconfig.insertBefore)(0)
      expect(m.args[0]).toBeInstanceOf(PIXI.Container) // parent
      expect(m.args[1].text).toEqual('two') // child
      expect(m.args[2].text).toEqual('three') // beforeChild
    })

    test('update elements', () => {
      act(() =>
        renderInContainer(
          <Container>
            <Text text="a" />
          </Container>
        )
      )

      act(() =>
        renderInContainer(
          <Container>
            <Text text="b" />
          </Container>
        )
      )

      const m = getCall(hostconfig.commitUpdate)
      expect(m.fn).toHaveBeenCalledTimes(1)
      expect(m(0).args[3]).toHaveProperty('text', 'a')
      expect(m(0).args[4]).toHaveProperty('text', 'b')
      expect(m(0).args[0].text).toEqual('b')
    })
  })

  describe('prepare updates', () => {
    test('prevent commitUpdate when prop is not changed, ', () => {
      act(() => renderInContainer(<Text x={100} />))

      act(() => renderInContainer(<Text x={100} />))

      expect(hostconfig.commitUpdate).not.toBeCalled()
    })

    test('commitUpdate for prop removal', () => {
      act(() => renderInContainer(<Text x={100} />))

      act(() => renderInContainer(<Text />))

      const m = getCall(hostconfig.commitUpdate)
      expect(m.fn).toHaveBeenCalledTimes(1)

      const args = m(0).args

      expect(args[0]).toBeInstanceOf(PIXI.Text)
      expect(args[1]).toEqual(['x', null])
      expect(args[2]).toEqual('Text')
      expect(args[3]).toEqual({ x: 100 })
      expect(args[4]).toEqual({})
    })

    test('commitUpdate for prop change', () => {
      act(() => renderInContainer(<Text x={100} />))

      act(() => renderInContainer(<Text x={105} />))

      const m = getCall(hostconfig.commitUpdate)
      expect(m.fn).toHaveBeenCalledTimes(1)

      const args = m(0).args

      expect(args[0]).toBeInstanceOf(PIXI.Text)
      expect(args[1]).toEqual(['x', 105])
      expect(args[2]).toEqual('Text')
      expect(args[3]).toEqual({ x: 100 })
      expect(args[4]).toEqual({ x: 105 })
    })
  })

  describe('custom lifecycles', () => {
    let didMount = jest.fn()
    let willUnmount = jest.fn()
    let applyProps = jest.fn()

    beforeEach(() => {
      hostconfig.createInstance.mockImplementation((...args) => {
        const ins = createElement(...args)
        ins.didMount = (...args) => didMount(...args)
        ins.willUnmount = (...args) => willUnmount(...args)
        ins.applyProps = (...args) => applyProps(...args)
        return ins
      })
    })

    test('didMount', () => {
      act(() =>
        renderInContainer(
          <Container>
            <Text />
          </Container>
        )
      )

      expect(didMount).toHaveBeenCalledTimes(2)

      const text = getCall(didMount)(0).args
      expect(text[0]).toBeInstanceOf(PIXI.Text)
      expect(text[1]).toBeInstanceOf(PIXI.Container)
      expect(text[1].root).toBeUndefined()

      const container = getCall(didMount)(1).args
      expect(container[0]).toBeInstanceOf(PIXI.Container)
      expect(container[0].root).toBeUndefined()
      expect(container[1]).toBeInstanceOf(PIXI.Container)
      expect(container[1].root).toEqual(true)
    })

    test('willUnmount', () => {
      act(() =>
        renderInContainer(
          <Container>
            <Text />
          </Container>
        )
      )

      act(() => renderInContainer(<Container />))

      expect(willUnmount).toHaveBeenCalledTimes(1)

      const m = getCall(willUnmount)(0).args
      expect(m[0]).toBeInstanceOf(PIXI.Text)
      expect(m[1]).toBeInstanceOf(PIXI.Container)
      expect(m[1].root).toBeUndefined()
    })

    test('applyProps', () => {
      act(() =>
        renderInContainer(
          <Container>
            <Text />
          </Container>
        )
      )

      act(() =>
        renderInContainer(
          <Container>
            <Text x={100} />
          </Container>
        )
      )

      expect(applyProps).toHaveBeenCalledTimes(1)

      const m = getCall(applyProps)

      expect(m(0).args[0]).toBeInstanceOf(PIXI.Text)
      expect(m(0).args[1]).toEqual({})
      expect(m(0).args[2]).toEqual({ x: 100 })
    })

    describe('config', () => {
      const createInstances = config => {
        const instances = []
        hostconfig.createInstance.mockImplementation((...args) => {
          const ins = createElement(...args)
          ins.didMount = (...args) => didMount(...args)
          ins.willUnmount = (...args) => willUnmount(...args)
          ins.applyProps = (...args) => applyProps(...args)
          ins.config = config
          instances.push(ins)
          jest.spyOn(ins, 'destroy')
          return ins
        })
        return instances
      }

      test('destroy', () => {
        const before = createInstances({ destroy: true })
        act(() => renderInContainer(<Container />))
        act(() => renderInContainer(<></>))
        before.forEach(ins => expect(ins.destroy).toHaveBeenCalled())

        const after = createInstances({ destroy: false })
        act(() => renderInContainer(<Container />))
        act(() => renderInContainer(<></>))
        after.forEach(ins => expect(ins.destroy).not.toHaveBeenCalled())
      })

      test('destroyChildren', () => {
        const before = createInstances({ destroyChildren: true })
        act(() =>
          renderInContainer(
            <Container>
              <Text />
            </Container>
          )
        )
        const spyBefore = jest.spyOn(before[1].children[0], 'destroy')

        act(() => renderInContainer(<></>))
        expect(spyBefore).toHaveBeenCalled()

        const after = createInstances({ destroyChildren: false })
        act(() =>
          renderInContainer(
            <Container>
              <Text />
            </Container>
          )
        )
        const spyAfter = jest.spyOn(after[1].children[0], 'destroy')

        act(() => renderInContainer(<></>))
        expect(spyAfter).not.toHaveBeenCalled()
      })
    })
  })

  // TODO Suspence tests just doesn't work right now and I can't understand why
  // Probably the async nature interferes somehow
  // Or implementation details of reconciler changed
  describe('suspense', () => {
    let asyncLoaded = false

    beforeEach(() => {
      asyncLoaded = false
    })

    function AsyncText({ ms, text }) {
      if (!asyncLoaded) {
        const promise = new Promise(res => {
          setTimeout(() => {
            asyncLoaded = true
            res()
          }, ms)
        })
        throw promise
      }

      return <Text text={text} />
    }

    /**
     * -------------------------------------------
     * For React-18 content inside Suspense will not be rendered
     *
     * See:
     *   https://github.com/reactjs/rfcs/blob/main/text/0213-suspense-in-react-18.md#behavior-change-committed-trees-are-always-consistent
     * -------------------------------------------
     */
    test('renders suspense fallback', async () => {
      jest.useFakeTimers()

      const loadingTextRef = React.createRef()
      const siblingTextRef = React.createRef()

      await act(async () =>
        renderInContainer(
          <Suspense fallback={<Text text="loading" ref={loadingTextRef} />}>
            <Text text="hidden" ref={siblingTextRef} />
            <AsyncText ms={500} text="content" />
          </Suspense>
        )
      )
      jest.runAllTimers()

      // "loading" Text should be rendered
      expect(loadingTextRef.current).toBeDefined()
      // "hidden" Text should be null
      expect(siblingTextRef.current).toBeNull();
    })

    test('renders suspense content', () => {
      jest.useFakeTimers()

      const siblingTextRef = React.createRef()
      const loadingTextRef = React.createRef()

      act(() =>
        renderInContainer(
          <Suspense fallback={<Text text="loading" ref={loadingTextRef} />}>
            <Text text="A" ref={siblingTextRef} />
            <AsyncText ms={500} text="content" />
          </Suspense>
        )
      )

      expect(siblingTextRef.current).toBeNull();
      jest.runAllTimers()

      act(() =>
        renderInContainer(
          <Suspense fallback={<Text text="loading" ref={loadingTextRef} />}>
            <Text text="A" ref={siblingTextRef} />
            <AsyncText ms={500} text="content" />
          </Suspense>
        )
      )

      // hidden content should be present again
      expect(siblingTextRef.current).not.toBeNull();
      // loading text, sibling text, and async text content were all created
      const createInstanceMock = getCall(hostconfig.createInstance);
      expect(createInstanceMock.all.map(([ins, obj]) => obj.text)).toEqual(['A', 'loading', 'A', 'content'])
    })
  })

  describe('emits request render', () => {
    let spy1 = jest.fn()
    let spy2 = jest.fn()
    beforeEach(() => {
      spy1.mockClear()
      spy2.mockClear()
      container1.on('__REACT_PIXI_REQUEST_RENDER__', spy1)
      container2.on('__REACT_PIXI_REQUEST_RENDER__', spy2)
      root1 = createRoot(container1)
      root2 = createRoot(container2)
    })

    afterEach(() => {
      container1.off('__REACT_PIXI_REQUEST_RENDER__', spy1)
      container2.off('__REACT_PIXI_REQUEST_RENDER__', spy2)
      act(() => root1.unmount())
      act(() => root2.unmount())
    })

    it('receives request events via root container', function () {
      act(() =>
        renderInContainer1(
          <Container>
            <Text text="one" />
          </Container>
        )
      )

      expect(spy1).toHaveBeenCalled()
      expect(spy1).toHaveBeenCalledTimes(2) // spy1 called 2 times: 1 - appendInitialChild, 2 - appendChildToContainer
    })

    it('receives different events in different containers', function () {
      act(() =>
          renderInContainer1(
          <Container>
            <Text text="one" />
          </Container>
        )
      )

      act(() =>
        renderInContainer2(
          <Container>
            <Text text="one" />
          </Container>
        )
      )

      act(() =>
        renderInContainer2(
          <Container>
            <Text text="two" />
          </Container>
        )
      )

      expect(spy1).toHaveBeenCalledTimes(2); // spy1 called 2 times: 1 - appendInitialChild, 2 - appendChildToContainer
      expect(spy2).toHaveBeenCalledTimes(3); //  spy2 called 3 times: 1 - appendInitialChild 2 - appendChildToContainer 3 - commitUpdate
    })
  })
})

