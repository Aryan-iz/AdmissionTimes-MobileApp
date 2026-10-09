import { View, Text, StyleSheet } from 'react-native'
import { radius } from '../../theme'

// Muted palette; a university always gets the same color.
const PALETTE = ['#2563EB', '#0F766E', '#7C3AED', '#B45309', '#BE185D', '#4338CA', '#047857', '#9333EA']

const STOP_WORDS = new Set(['of', 'the', 'and', 'for', 'university', 'institute'])

/** "Sukkur IBA University" -> "SI", "GIKI" -> "GI", "Fast University" -> "FA". */
export const universityInitials = (name: string): string => {
  const words = name.replace(/[()]/g, ' ').split(/\s+/).filter(Boolean)
  const meaningful = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()))
  const source = meaningful.length > 0 ? meaningful : words
  if (source.length >= 2) return (source[0][0] + source[1][0]).toUpperCase()
  return (source[0] || '?').slice(0, 2).toUpperCase()
}

const colorFor = (name: string): string => {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export default function UniversityAvatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <View
      style={[styles.avatar, { width: size, height: size, backgroundColor: colorFor(name) }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>{universityInitials(name)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
})
