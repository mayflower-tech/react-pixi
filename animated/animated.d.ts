import { Application as PIXI_Application } from '@pixi/app'
import { Texture as PIXI_Texture } from '@pixi/core'
import { Container as PIXI_Container, DisplayObject as PIXI_DisplayObject } from '@pixi/display'
import { Graphics as PIXI_Graphics } from '@pixi/graphics'
import { InteractionEvent as PIXI_InteractionEvent } from '@pixi/interaction'
import { Point as PIXI_Point, ObservablePoint as PIXI_ObservablePoint } from '@pixi/math'
import {
  NineSlicePlane as PIXI_NineSlicePlane,
  SimpleRope as PIXI_SimpleRope,
  SimpleMesh as PIXI_SimpleMesh,
} from '@pixi/mesh-extras'
import { Text as PIXI_Text } from '@pixi/text'
import { BitmapText as PIXI_BitmapText } from '@pixi/text-bitmap'
import { Ticker as PIXI_Ticker } from '@pixi/ticker'
import { Sprite as PIXI_Sprite } from '@pixi/sprite'
import { TilingSprite as PIXI_TilingSprite } from '@pixi/sprite-tiling'
import { AnimatedSprite as PIXI_AnimatedSprite } from '@pixi/sprite-animated'
import { ParticleContainer as PIXI_ParticleContainer } from '@pixi/particle-container'

import * as React from 'react';
import { ElementType, ComponentPropsWithRef } from '@react-spring/types';
import { AnimatedProps } from 'react-spring';

type AnimatedComponent<T extends ElementType> = React.ForwardRefExoticComponent<AnimatedProps<ComponentPropsWithRef<T>>>;

// Reconciler API
interface Reconciler<Instance, TextInstance, Container, PublicInstance> {
  updateContainerAtExpirationTime(
    element: any,
    container: any,
    parentComponent: React.Component<any, any> | null | undefined,
    expirationTime: any,
    callback: () => void | null | undefined
  ): any;
  createContainer(containerInfo: any, isConcurrent: boolean, hydrate: boolean): any;
  updateContainer(
    element: any,
    container: any,
    parentComponent: React.Component<any, any> | null | undefined,
    callback: () => void | null | undefined
  ): any;
  flushRoot(root: any, expirationTime: any): void;
  requestWork(root: any, expirationTime: any): void;
  computeUniqueAsyncExpiration(): any;
  batchedUpdates<A>(fn: () => A): A;
  unbatchedUpdates<A>(fn: () => A): A;
  deferredUpdates<A>(fn: () => A): A;
  syncUpdates<A>(fn: () => A): A;
  interactiveUpdates<A>(fn: () => A): A;
  flushInteractiveUpdates(): void;
  flushControlled(fn: () => any): void;
  flushSync<A>(fn: () => A): A;
  getPublicRootInstance(container: any): React.Component<any, any> | PublicInstance | null;
  findHostInstance(component: object): PublicInstance | null;
  findHostInstanceWithNoPortals(component: any): PublicInstance | null;
  injectIntoDevTools(devToolsConfig: any): boolean;
}

interface ReconcilerConfig {
  getRootHostContext(rootContainerInstance: any): any;
  getChildHostContext(): any;
  getChildHostContextForEventComponent(parentHostContext: any): any;
  getPublicInstance(getPublicInstance: any): any;
  prepareForCommit(): void;
  resetAfterCommit(): void;
  createInstance(...args: any[]): any;
  hideInstance(ins: any): void;
  unhideInstance(ins: any, props: any): void;
  appendInitialChild(...args: any[]): any;
  finalizeInitialChildren(doFinalize: boolean): boolean;
  prepareUpdate(...args: any): any;
  shouldSetTextContent(type: any, props: any): boolean;
  shouldDeprioritizeSubtree(type: any, props: any): boolean;
  createTextInstance(): void;
  mountEventComponent(): void;
  updateEventComponent(): void;
  handleEventTarget(): void;
  scheduleTimeout(...args: any[]): any;
  cancelTimeout(...args: any[]): any;
  appendChild(...args: any[]): any;
  appendChildToContainer(...args: any[]): any;
  removeChild(...args: any[]): any;
  removeChildFromContainer(...args: any[]): any;
  insertBefore(...args: any[]): any;
  insertInContainerBefore(...args: any[]): any;
  commitUpdate(...args: any[]): any;
  commitMount(...args: any[]): any;
  commitTextUpdate(...args: any[]): any;
  resetTextContent(...args: any[]): any;
}

export type InteractionEventTypes =
  | 'click'
  | 'mousedown'
  | 'mousemove'
  | 'mouseout'
  | 'mouseover'
  | 'mouseup'
  | 'mouseupoutside'
  | 'tap'
  | 'touchstart'
  | 'touchmove'
  | 'touchend'
  | 'touchendoutside'
  | 'pointercancel'
  | 'pointerout'
  | 'pointerover'
  | 'pointertap'
  | 'pointerdown'
  | 'pointerup'
  | 'pointerupoutside'
  | 'pointermove'
  | 'rightclick'
  | 'rightdown'
  | 'rightup'
  | 'rightupoutside'
  | 'touchcancel'
  | 'touchendoutside'
  | 'touchmove'
  | 'touchstart';

export type InteractionEvents = {
  [P in InteractionEventTypes]?: (
    event: PIXI_InteractionEvent
  ) => void;
};

// private
declare namespace _ReactPixi {
  type FunctionTypes<T> = {
    [P in keyof T]: ((...args: any) => any) extends T[P] ? P : never;
  }[keyof T];

  type IfEquals<X, Y, A = X, B = never> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? A : B;

  type ReadonlyKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
  }[keyof T];

  type ApplicationOptions = ConstructorParameters<typeof PIXI_Application>[0];
  type PointLike =
    | PIXI_Point
    | PIXI_ObservablePoint
    | [number, number]
    | [number]
    | number
    | { x: number, y: number };
  type ImageSource = string | HTMLImageElement;
  type VideoSource = string | HTMLVideoElement;
  type AnySource = number | ImageSource | VideoSource | HTMLCanvasElement | PIXI_Texture;
  type WithPointLike<T extends keyof any> = { [P in T]: PointLike };

  interface WithSource {
    /**
     * Directly apply an image
     *
     * @example
     *
     * image="./image.png"
     */
    image?: ImageSource;

    /**
     * Directly apply a video
     *
     * @example
     *
     * video="./video.mp4"
     */
    video?: VideoSource;

    /**
     * Directly apply a source.
     * Can be an image, video, canvas, frame id or even a texture
     *
     * @example
     *
     * source="./image.jpg"
     * source="./video.mp4"
     * source={document.querySelector('img')}
     * source={document.querySelector('video')}
     * source={document.querySelector('canvas')}
     */
    source?: AnySource;
  }

  type P = 'position' | 'scale' | 'pivot' | 'anchor' | 'skew';

  type Container<T extends PIXI_DisplayObject, U = {}> = Partial<
    Omit<T, 'children' | P | ReadonlyKeys<T> | keyof U> &
    WithPointLike<P>
  > & U & InteractionEvents & { ref?: React.Ref<T> };

  type IContainer = Container<PIXI_Container>;
  type ISprite = Container<PIXI_Sprite, WithSource>;
  type IText = Container<PIXI_Text, WithSource>;
  type IGraphics = Container<PIXI_Graphics, {
    /**
     * Draw a graphic with imperative callback.
     *
     * @param {PIXI.Graphics} graphics - The graphics instance to draw on
     * @example
     *
     * draw={g => {
     *   g.beginFill(0xff0000);
     *   g.drawRect(0,0,100,100);
     *   g.endFill();
     * }}
     */
    draw?(graphics: PIXI_Graphics): void;
  }>;

  type IBitmapText = Container<
    PIXI_BitmapText,
    {
      /**
       * Set the style object
       *
       * @example
       *
       * style={{ font: '50px Desyrel' }}
       */
      style?: ConstructorParameters<typeof PIXI_BitmapText>[1];
    }
  >;

  type INineSlicePlane = Container<PIXI_NineSlicePlane, WithSource>;
  type IParticleContainer = Container<
    PIXI_ParticleContainer,
    {
      maxSize?: ConstructorParameters<typeof PIXI_ParticleContainer>[0];
      properties?: ConstructorParameters<typeof PIXI_ParticleContainer>[1];
      batchSize?: ConstructorParameters<typeof PIXI_ParticleContainer>[2];
      autoResize?: ConstructorParameters<typeof PIXI_ParticleContainer>[3];
    }
  >;

  type ITilingSprite = Container<
    PIXI_TilingSprite,
    WithSource & {
      tileScale?: PointLike;
      tilePosition: PointLike;
    }
  >;

  type ISimpleRope = Container<PIXI_SimpleRope, WithSource>;
  type ISimpleMesh = Container<
    PIXI_SimpleMesh,
    WithSource & {
      uvs?: ConstructorParameters<typeof PIXI_SimpleMesh>[2];
      indices?: ConstructorParameters<typeof PIXI_SimpleMesh>[3];
    }
  >;

  type IAnimatedSprite = Container<
    PIXI_AnimatedSprite,
    WithSource & {
      isPlaying: boolean;
      images?: string[];
      initialFrame?: number;
    }
  >;

  type IStage = React.CanvasHTMLAttributes<HTMLCanvasElement> & {
    /**
     * Width of the Stage and canvas
     */
    width?: number;

    /**
     * Height of the Stage and canvas
     */
    height?: number;

    /**
     * Enable the {@see PIXI_Application} ticker? [default=true].
     * Automatically renders the stage on request animation frame.
     */
    raf?: boolean;

    /**
     * Render the PIXI stage on React component changes.
     * You'll need to set raf={false}.
     */
    renderOnComponentChange?: boolean;

    /**
     * The PIXI application options.
     *
     * @see PIXI_ApplicationOptions
     * @example
     *
     * options={{ antialias: true, roundPixels: true }}
     */
    options?: ApplicationOptions;

    /**
     * Callback when the component is successfully mounted
     *
     * @param {PIXI.Application} app
     */
    onMount?(app: PIXI_Application): void;

    /**
     * Callback when the component is successfully unmounted
     *
     * @param {PIXI.Application} app
     */
    onUnmount?(app: PIXI_Application): void;
  };

  interface ICustomComponent<
    P extends { [key: string]: any },
    PixiInstance extends PIXI_DisplayObject
    > {
    /**
     * Create the PIXI instance
     * The component is created during React reconciliation.
     *
     * @param props passed down props
     * @returns {PIXI.DisplayObject}
     */
    create(props: P): PixiInstance;

    /**
     * Instance mounted
     * This is called during React reconciliation.
     *
     * @param {PIXI.DisplayObject} instance
     * @param {PIXI.Container} parent
     */
    didMount?(instance: PixiInstance, parent: PIXI_Container): void;

    /**
     * Instance will unmount
     * This is called during React reconciliation.
     *
     * @param {PIXI.DisplayObject} instance
     * @param {PIXI.Container} parent
     */
    willUnmount?(instance: PixiInstance, parent: PIXI_Container): void;

    /**
     * Apply props for this custom component.
     * This is called during React reconciliation.
     *
     * @param {PIXI.DisplayObject} instance
     * @param oldProps
     * @param newProps
     */
    applyProps?(
      instance: PixiInstance,
      oldProps: Readonly<P>,
      newProps: Readonly<P>
    ): void;
  }
}

// components
export const Text: AnimatedComponent<React.FC<React.PropsWithChildren<_ReactPixi.IText>>>;
export const Sprite: AnimatedComponent<React.FC<React.PropsWithChildren<_ReactPixi.ISprite>>>;
export const Container: AnimatedComponent<React.FC<React.PropsWithChildren<_ReactPixi.IContainer>>>;
export const Graphics: AnimatedComponent<React.FC<React.PropsWithChildren<_ReactPixi.IGraphics>>>;
export const BitmapText: AnimatedComponent<React.FC<React.PropsWithChildren<_ReactPixi.IBitmapText>>>;
export const NineSlicePlane: AnimatedComponent<React.FC<React.PropsWithChildren<_ReactPixi.INineSlicePlane>>>;
export const ParticleContainer: AnimatedComponent<React.FC<React.PropsWithChildren<_ReactPixi.IParticleContainer>>>;
export const TilingSprite: AnimatedComponent<React.FC<React.PropsWithChildren<_ReactPixi.ITilingSprite>>>;
export const SimpleRope: AnimatedComponent<React.FC<React.PropsWithChildren<_ReactPixi.ISimpleRope>>>;
export const SimpleMesh: AnimatedComponent<React.FC<React.PropsWithChildren<_ReactPixi.ISimpleMesh>>>;
export const AnimatedSprite: AnimatedComponent<React.FC<React.PropsWithChildren<_ReactPixi.IAnimatedSprite>>>;

export interface ReactPixiRoot {
  render(element: React.ReactElement | React.ReactElement[] | React.Factory<any>): any
  unmount(): void
}

export const createRoot: (container: PIXI_Container) => ReactPixiRoot

// renderer
/** @deprecated use createRoot instead */
export const render: (
  element: React.ReactElement | React.ReactElement[] | React.Factory<any>,
  container: PIXI_Container,
  callback?: (...args: any) => void
) => any;

// unmount component
/** @deprecated use root.unmount() instead */
export const unmountComponentAtNode: (container: PIXI_Container) => void

// context
export const AppContext: React.Context<PIXI_Application>;
export const AppProvider: React.ComponentType<React.ProviderProps<PIXI_Application>>;
export const AppConsumer: React.ComponentType<React.ConsumerProps<PIXI_Application>>;

// fiber
export const PixiFiber: (
  eventsMap?: { [P in keyof ReconcilerConfig]: (...args: any) => void }
) => Reconciler<any, any, any, any>;

// stage
export class Stage extends React.Component<_ReactPixi.IStage> { }

/**
 * Create a Custom PIXI Component
 *
 * @example
 *
 * type RectangleProps = { x: number, y: number, color: number };
 *
 * const Rectangle = PixiComponent<RectangleProps, PIXI_Graphics>('Rectangle', {
 *   create() {
 *     return new PIXI_Graphics();
 *   }
 *   applyProps(ins: PIXI_Graphics, oldProps: RectangleProps, newProps: RectangleProps) {
 *     ins.clear();
 *     ins.beginFill(newProps.color);
 *     ins.drawRect(newProps.x, newProps.y, 100, 100);
 *     ins.endFill();
 *   }
 * });
 */
export const PixiComponent: <Props, PixiInstance extends PIXI_DisplayObject>(
  componentName: string,
  lifecycle: _ReactPixi.ICustomComponent<Props, PixiInstance>
) => AnimatedComponent<React.FC<Props & { ref?: React.Ref<PixiInstance> }>>;

/**
 * Tap into the {PIXI.Application} ticker raf.
 *
 * @example
 *
 * const MyComponent = () => {
 *   const [x, setX] = useState(0);
 *   useTick(() => setX(x + 1));
 *
 *   return <Sprite x={x} />
 * }
 */
export const useTick: (
  tick: (this: PIXI_Ticker, delta: number, ticker: PIXI_Ticker) => void,
  enabled?: boolean
) => void;

/**
 * Get the {<Stage>} {PIXI.Application} instance.
 *
 * @example
 *
 * const MyComponent = () => {
 *   const app = useApp(); // app = PIXI_Application
 *
 *   return <Sprite x={x} />
 * }
 *
 */
export const useApp: () => PIXI_Application;

/**
 * Higher Order Component to attach the {PIXI.Application} to `app` prop.
 *
 * @example
 *
 * interface Props {
 *   app: PIXI_Application
 * }
 *
 * export default withPixiApp(
 *   ({ app }) => (
 *     //
 *   )
 * );
 */
export const withPixiApp: <P extends { app: PIXI_Application }>(
  WrappedComponent: React.ComponentType<P>
) => AnimatedComponent<React.ComponentClass<Omit<P, 'app'>>>;

/**
 * Apply default props. Useful in Custom Components.
 *
 * @example
 *
 * const Rectangle = PixiComponent('Rectangle', {
 *   create() {
 *     return new PIXI_Graphics();
 *   },
 *   applyProps(instance, oldProps, newProps) {
 *     applyDefaultProps(instance, oldProps, newProps);
 *   }
 * });
 */
export const applyDefaultProps: <P extends object>(
  instance: PIXI_DisplayObject,
  oldProps: P,
  newProps: P
) => void;

/**
 * Create a filter wrapper to easily facilitate filter arguments as props
 * in a declarative way.
 *
 * @example
 *
 * render() {
 *   return (
 *     <Container>
 *       <BlurAndAdjustmentFilter
 *         blurFilter={{'blur': 5}}
 *         adjustmentFilter={{'gamma': 3, 'brightness': 5}}
 *       >
 *         <Sprite texture={texture} />
 *       </BlurAndAdjustmentFilter>
 *     </Container>
 *   )
 * }
 */
export const withFilters: <
  Component extends React.ComponentType<
    _ReactPixi.Container<PIXI_DisplayObject, any>
  >,
  Filters extends { [filterKey: string]: any }
  >(
  WrapperComponent: Component,
  filters: Filters
) => AnimatedComponent<React.ComponentType<
  React.ComponentProps<Component> & Partial<
    { [P in keyof Filters]: Partial<InstanceType<Filters[P]> & { construct: ConstructorParameters<Filters[P]> }> }>
>>;

/**
 * Get the component instance ref
 *
 * @example
 *
 * const App = () => {
 *   const containerRef = React.useRef<PixiRef<typeof Container>>(null);
 *
 *   return <Container ref={containerRef} />
 * };
 */
export type PixiRef<T extends React.ComponentType<any>> = Extract<
  React.ComponentProps<T>['ref'],
  React.RefObject<any>
> extends React.Ref<infer R>
  ? R
  : never;
