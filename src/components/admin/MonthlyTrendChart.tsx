import { View, Text, StyleSheet, ScrollView } from 'react-native'

interface MonthlyTrend {
  month: string
  count: number
}

interface MonthlyTrendChartProps {
  data: MonthlyTrend[]
}

export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count))
  const chartHeight = 180

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartWrapper}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>{maxCount}</Text>
            <Text style={styles.yAxisLabel}>{Math.floor(maxCount / 2)}</Text>
            <Text style={styles.yAxisLabel}>0</Text>
          </View>

          {/* Chart area */}
          <View style={[styles.chartArea, { height: chartHeight }]}>
            {data.map((item, index) => {
              const barHeight = (item.count / maxCount) * (chartHeight - 40)
              const isLatest = index === data.length - 1

              return (
                <View key={item.month} style={styles.barColumn}>
                  <View style={[styles.barWrapper, { height: chartHeight - 40 }]}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: isLatest ? '#2563EB' : '#DBEAFE',
                          height: barHeight,
                        },
                      ]}
                    >
                      <Text style={styles.barValue}>{item.count}</Text>
                    </View>
                  </View>
                  <Text style={styles.monthLabel} numberOfLines={1}>
                    {item.month}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  chartWrapper: {
    flexDirection: 'row',
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 8,
    height: 180,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  barColumn: {
    width: 50,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  barWrapper: {
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  monthLabel: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    transform: [{ rotate: '-45deg' }],
    width: 60,
    marginTop: 8,
  },
})
