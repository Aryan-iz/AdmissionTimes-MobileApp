import { useState } from 'react'
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native'
import { Feather } from '@expo/vector-icons'

interface ReminderModalProps {
  visible: boolean
  onClose: () => void
  onSetReminder: () => void
  programName: string
  deadline: string
}

export default function ReminderModal({
  visible,
  onClose,
  onSetReminder,
  programName,
  deadline,
}: ReminderModalProps) {
  const [scaleAnim] = useState(new Animated.Value(0))
  const [hasOpened, setHasOpened] = useState(false)

  const handleOpen = () => {
    setHasOpened(true)
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start()
  }

  const handleClose = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose()
      setHasOpened(false)
    })
  }

  const handleSetReminder = () => {
    onSetReminder()
    handleClose()
  }

  if (visible && !hasOpened) {
    handleOpen()
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: scaleAnim,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="bell" size={28} color="#2563EB" />
            </View>
            <Text style={styles.title}>Enable Reminder</Text>
            <Text style={styles.subtitle}>
              Save this admission and enable deadline alerts for {programName}
            </Text>
          </View>

          {/* Deadline Info */}
          <View style={styles.deadlineCard}>
            <View style={styles.deadlineIcon}>
              <Feather name="calendar" size={18} color="#2563EB" />
            </View>
            <View style={styles.deadlineInfo}>
              <Text style={styles.deadlineLabel}>Application Deadline</Text>
              <Text style={styles.deadlineDate}>{deadline}</Text>
            </View>
          </View>

          <View style={styles.reminderInfoCard}>
            <View style={styles.reminderIconContainer}>
              <Feather name="bookmark" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.reminderTextContainer}>
              <Text style={styles.reminderTitle}>What happens</Text>
              <Text style={styles.reminderValue}>This program will be saved and alerts will be enabled.</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={handleSetReminder}>
              <Text style={styles.confirmButtonText}>Save & Enable Alert</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deadlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  deadlineDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reminderInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  reminderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  reminderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
