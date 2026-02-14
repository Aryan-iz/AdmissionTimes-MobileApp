import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Dimensions, Animated, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import type { StudentAdmission } from '../../data/studentData'

const { width } = Dimensions.get('window')
const SLIDER_WIDTH = width - 32

interface NewAdmissionSliderProps {
  admissions: StudentAdmission[]
}

export default function NewAdmissionSlider({ admissions }: NewAdmissionSliderProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const [currentIndex, setCurrentIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (admissions.length <= 1) return

    const interval = setInterval(() => {
      // Fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change slide
        setCurrentIndex((prev) => (prev + 1) % admissions.length)
        
        // Reset position
        slideAnim.setValue(20)
        
        // Fade in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start()
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [admissions.length, fadeAnim, slideAnim])

  if (admissions.length === 0) return null

  const currentAdmission = admissions[currentIndex]

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.slider,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <Pressable 
          style={styles.sliderContent}
          onPress={() => navigation.navigate('ProgramDetail', { id: currentAdmission.id })}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✨ NEW</Text>
          </View>
          
          <View style={styles.content}>
            <View style={styles.textContent}>
              <Text style={styles.title} numberOfLines={1}>
                {currentAdmission.university}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {currentAdmission.program}
              </Text>
              <View style={styles.details}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>📍 {currentAdmission.city}</Text>
                </View>
                <View style={styles.detailSeparator} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>💰 {currentAdmission.fee}</Text>
                </View>
                <View style={styles.detailSeparator} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>📅 {currentAdmission.deadlineDisplay}</Text>
                </View>
              </View>
            </View>

            <View style={styles.arrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </View>

          {admissions.length > 1 && (
            <View style={styles.indicators}>
              {admissions.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  slider: {
    width: SLIDER_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sliderContent: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FBBF24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingRight: 12,
  },
  textContent: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  detailSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4F46E5',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 12,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  indicatorActive: {
    width: 20,
    backgroundColor: '#4F46E5',
  },
})
