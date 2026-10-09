import { createNavigationContainerRef } from '@react-navigation/native'
import type { RootStackParamList } from './types'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export const getActiveRouteName = (): string | undefined =>
  navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined

// Dev-only hook so browser E2E tests can open screens directly (never in release builds).
if (__DEV__) {
  ;(globalThis as unknown as { __admissionTimesNav?: typeof navigationRef }).__admissionTimesNav = navigationRef
}
