import { View, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, font, radius, spacing } from '../../theme'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'violet'

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  neutral: { bg: colors.neutralSoft, fg: colors.textMuted },
  primary: { bg: colors.primarySoft, fg: colors.primary },
  violet: { bg: colors.violetSoft, fg: colors.violet },
}

interface BadgeProps {
  label: string
  tone?: BadgeTone
  icon?: keyof typeof Feather.glyphMap
}

/** Small pill label used for statuses and sources. */
export default function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const { bg, fg } = TONES[tone]
  return (
    <View style={[styles.badge, { backgroundColor: bg }]} accessibilityRole="text" accessibilityLabel={label}>
      {icon ? <Feather name={icon} size={11} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  label: {
    fontSize: font.caption,
    fontWeight: '600',
  },
})
