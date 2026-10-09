import type { ReactNode } from 'react'
import { View, ScrollView, RefreshControl, StyleSheet, type ScrollViewProps } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { PremiumHeader } from './PremiumHeader'
import TitleHeader from './TitleHeader'
import StudentTabBar, { isTabRoute } from '../navigation/StudentTabBar'
import { colors, spacing, FLOATING_BUTTON_CLEARANCE } from '../../theme'

interface StudentScreenProps {
  children: ReactNode
  /** Secondary screens (detail, compare) get a back-button header and no tab bar. */
  title?: string
  refreshing?: boolean
  onRefresh?: () => void
  /** Rendered above the scroll area (e.g. a sticky compare bar). */
  top?: ReactNode
  scroll?: boolean
  scrollProps?: ScrollViewProps
}

/**
 * Frame for every student screen: header, scrolling content with pull-to-refresh,
 * bottom padding so the AI button never covers content, and the tab bar on main screens.
 */
export default function StudentScreen({ children, title, refreshing = false, onRefresh, top, scroll = true, scrollProps }: StudentScreenProps) {
  const route = useRoute()
  const showTabs = isTabRoute(route.name)

  return (
    <View style={styles.container}>
      {title ? <TitleHeader title={title} /> : <PremiumHeader />}
      {top}
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.scroll}>{children}</View>
      )}
      {showTabs ? <StudentTabBar /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: FLOATING_BUTTON_CLEARANCE,
  },
})
