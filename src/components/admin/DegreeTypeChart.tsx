import { View, Text, StyleSheet } from 'react-native'

interface DegreeType {
  type: string
  count: number
  percentage: number
}

interface DegreeTypeChartProps {
  data: DegreeType[]
}

const colors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#9333EA']

export default function DegreeTypeChart({ data }: DegreeTypeChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <View style={styles.container}>
      <View style={styles.donutContainer}>
        {/* Simple donut representation with colored boxes */}
        {data.map((item, index) => {
          const color = colors[index % colors.length]
          return (
            <View key={item.type} style={styles.segmentContainer}>
              <View style={[styles.colorBox, { backgroundColor: color }]} />
              <View style={styles.segmentInfo}>
                <Text style={styles.degreeType}>{item.type}</Text>
                <Text style={styles.degreeCount}>
                  {item.count} ({item.percentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          )
        })}
      </View>
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{total}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  donutContainer: {
    marginBottom: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  segmentInfo: {
    flex: 1,
  },
  degreeType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  degreeCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalContainer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
})
