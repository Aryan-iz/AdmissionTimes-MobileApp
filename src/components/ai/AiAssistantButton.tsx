import { Pressable, StyleSheet, Animated, Text } from 'react-native'
import { useAi } from '../../contexts/AiContext'
import { useEffect, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function AiAssistantButton() {
  const { isOpen, toggleChat } = useAi()
  const scaleAnim = useRef(new Animated.Value(1)).current
  const insets = useSafeAreaInsets()

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isOpen ? 0.9 : 1,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start()
  }, [isOpen, scaleAnim])

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          bottom: insets.bottom + 24,
        },
      ]}
    >
      <Pressable style={styles.button} onPress={toggleChat}>
        <Text style={styles.icon}>{isOpen ? '✕' : '💬'}</Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
})
