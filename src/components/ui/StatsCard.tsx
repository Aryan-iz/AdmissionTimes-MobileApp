import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  iconColor?: string
  iconBgColor?: string
  style?: ViewStyle
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon = '📊',
  iconColor = '#2563EB',
  iconBgColor = '#E0E7FF',
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.content}>
        <View style={styles.textSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
})
