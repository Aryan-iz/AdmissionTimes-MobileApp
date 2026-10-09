import type { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { StudentAdmission } from '../../domain/admission'
import { colors, font, spacing } from '../../theme'
import UniversityAvatar from './UniversityAvatar'

interface AdmissionRowProps {
  admission: StudentAdmission
  onPress: () => void
  /** Right-hand content (date, days left, match label). */
  trailing?: ReactNode
  /** Line under the program name; defaults to the university. */
  subtitle?: string
}

/** Compact one-line admission entry for dashboard sections. */
export default function AdmissionRow({ admission, onPress, trailing, subtitle }: AdmissionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${admission.program}, ${admission.university}`}
    >
      <UniversityAvatar name={admission.university} size={36} />
      <View style={styles.body}>
        <Text style={styles.program} numberOfLines={1}>
          {admission.program}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle ?? admission.university}
        </Text>
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  program: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: 1,
  },
  trailing: {
    alignItems: 'flex-end',
    maxWidth: 130,
  },
})
