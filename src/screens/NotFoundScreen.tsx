/**
 * NotFoundScreen - 404 Error Page
 * 
 * Displayed when user navigates to an invalid route
 * Matches web frontend 404.tsx exactly
 */

import { View, Text, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '../navigation/AppNavigator'

export default function NotFoundScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const handleGoHome = () => {
    navigation.navigate('Home')
  }

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>😕</Text>
        </View>

        {/* Error Code */}
        <Text style={styles.errorCode}>404</Text>

        {/* Title */}
        <Text style={styles.title}>Page Not Found</Text>

        {/* Description */}
        <Text style={styles.description}>
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleGoHome}>
            <Text style={styles.primaryButtonText}>Go to Home</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleGoBack}>
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  errorCode: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 400,
    lineHeight: 24,
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
})
