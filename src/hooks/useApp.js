import invariant from '../utils/invariant'
import { useContext } from 'react'
import { Application } from '@pixi/app'
import { Context } from '../provider'

export function useApp() {
  const app = useContext(Context)

  invariant(
    app instanceof Application,
    'No Context found with `%s`. Make sure to wrap component with `%s`',
    'PIXI.Application',
    'AppProvider'
  )

  return app
}
