import { View, Text, StyleSheet } from 'react-native'

interface UniversityDistribution {
  university: string
  count: number
}

interface UniversityDistributionChartProps {
  data: UniversityDistribution[]
}

const colors = [
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#9333EA',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
]

export default function UniversityDistributionChart({ data }: UniversityDistributionChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count))

  return (
    <View style={styles.container}>
      {data.map((item, index) => {
        const barWidthPercent = (item.count / maxCount) * 100
        const color = colors[index % colors.length]

        return (
          <View key={item.university} style={styles.barContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.universityLabel} numberOfLines={1}>
                {item.university}
              </Text>
            </View>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: color,
                    width: `${barWidthPercent}%`,
                    opacity: 0.8,
                  },
                ]}
              >
                <Text style={styles.countText}>{item.count}</Text>
              </View>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelContainer: {
    width: 120,
  },
  universityLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  barWrapper: {
    flex: 1,
  },
  bar: {
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 30,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
