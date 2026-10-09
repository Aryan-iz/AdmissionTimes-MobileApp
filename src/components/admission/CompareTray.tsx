import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '../../navigation/types'
import { showErrorToast } from '../../services/toast'
import { colors, font, radius, spacing } from '../../theme'

export const MAX_COMPARE = 4

/** Selection state for picking up to MAX_COMPARE programs. */
export function useCompareSelection() {
  const [ids, setIds] = useState<string[]>([])
  const toggle = (id: string) =>
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_COMPARE) {
        showErrorToast('Compare', `You can compare up to ${MAX_COMPARE} programs.`)
        return prev
      }
      return [...prev, id]
    })
  const remove = (id: string) => setIds((prev) => prev.filter((x) => x !== id))
  return { ids, toggle, remove, clear: () => setIds([]) }
}

/** Bar shown above the list while programs are selected for comparison. */
export default function CompareTray({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  if (ids.length === 0) return null
  return (
    <View style={styles.tray}>
      <Text style={styles.text}>
        {ids.length} selected{ids.length < 2 ? ' · pick one more' : ''}
      </Text>
      <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button">
        <Text style={styles.clear}>Clear</Text>
      </Pressable>
      <Pressable
        style={[styles.button, ids.length < 2 && styles.buttonDisabled]}
        disabled={ids.length < 2}
        onPress={() => navigation.navigate('StudentCompare', { ids })}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Compare</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  tray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: font.body,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  clear: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.textMuted,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: font.body,
  },
})
