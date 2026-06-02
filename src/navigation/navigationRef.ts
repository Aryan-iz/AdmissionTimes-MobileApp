import { createNavigationContainerRef } from '@react-navigation/native'
import type { RootStackParamList } from './types'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export const getActiveRouteName = (): string | undefined =>
  navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined
