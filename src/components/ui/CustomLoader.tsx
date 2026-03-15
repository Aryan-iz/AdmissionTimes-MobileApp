import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, Easing } from 'react-native'
import { theme } from '../../theme'

interface CustomLoaderProps {
  size?: number
  color?: string
}

export default function CustomLoader({ size = 40, color = theme.colors.primary }: CustomLoaderProps) {
  const wave1 = useRef(new Animated.Value(0)).current
  const wave2 = useRef(new Animated.Value(0)).current
  const wave3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const createWaveAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1200,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )
    }

    const animation1 = createWaveAnimation(wave1, 0)
    const animation2 = createWaveAnimation(wave2, 200)
    const animation3 = createWaveAnimation(wave3, 400)

    animation1.start()
    animation2.start()
    animation3.start()

    return () => {
      animation1.stop()
      animation2.stop()
      animation3.stop()
    }
  }, [wave1, wave2, wave3])

  const createCircleStyle = (animatedValue: Animated.Value) => ({
    opacity: animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 1, 0.3],
    }),
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.6, 1.2, 0.6],
        }),
      },
    ],
  })

  const circleSize = size / 4

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.circle,
          { 
            width: circleSize, 
            height: circleSize, 
            borderRadius: circleSize / 2,
            backgroundColor: color,
          },
          createCircleStyle(wave1),
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          { 
            width: circleSize, 
            height: circleSize, 
            borderRadius: circleSize / 2,
            backgroundColor: color,
            marginHorizontal: 8,
          },
          createCircleStyle(wave2),
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          { 
            width: circleSize, 
            height: circleSize, 
            borderRadius: circleSize / 2,
            backgroundColor: color,
          },
          createCircleStyle(wave3),
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    // Dynamic styles applied inline
  },
})
