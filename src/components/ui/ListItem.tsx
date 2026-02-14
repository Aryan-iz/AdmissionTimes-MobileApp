import React from 'react'
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native'

interface ListItemProps {
  title: string
  subtitle?: string
  description?: string
  badge?: {
    text: string
    color: string
    bgColor: string
  }
  rightContent?: React.ReactNode
  onPress?: () => void
  style?: ViewStyle
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  description,
  badge,
  rightContent,
  onPress,
  style,
}) => {
  const Container = onPress ? Pressable : View

  return (
    <Container
      style={({ pressed }: any) => [
        styles.container,
        pressed && onPress && styles.pressed,
        style,
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {badge && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: badge.bgColor },
                ]}
              >
                <Text style={[styles.badgeText, { color: badge.color }]}>
                  {badge.text}
                </Text>
              </View>
            )}
          </View>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
        {rightContent && <View style={styles.rightSection}>{rightContent}</View>}
      </View>
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pressed: {
    backgroundColor: '#F9FAFB',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
