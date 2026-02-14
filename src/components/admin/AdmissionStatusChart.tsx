import { View, Text, StyleSheet } from 'react-native'
import { getVerificationStatusColor, type VerificationStatus } from '../../data/adminData'

interface StatusBreakdown {
  status: VerificationStatus
  count: number
  percentage: number
}

interface AdmissionStatusChartProps {
  data: StatusBreakdown[]
}

export default function AdmissionStatusChart({ data }: AdmissionStatusChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count))

  return (
    <View style={styles.container}>
      {data.map((item) => {
        const colors = getVerificationStatusColor(item.status)
        const barWidthPercent = (item.count / maxCount) * 100

        return (
          <View key={item.status} style={styles.barContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.statusLabel}>{item.status}</Text>
            </View>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: colors.bg,
                    width: `${barWidthPercent}%`,
                  },
                ]}
              >
                <Text style={[styles.countText, { color: colors.text }]}>
                  {item.count}
                </Text>
              </View>
              <Text style={styles.percentageText}>{item.percentage.toFixed(1)}%</Text>
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
    marginBottom: 16,
  },
  labelContainer: {
    width: 90,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  barWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 40,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
})
