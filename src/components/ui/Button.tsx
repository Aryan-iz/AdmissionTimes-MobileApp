import React from 'react'
import { Text, StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'small' | 'medium' | 'large'

interface ButtonProps {
  text: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  icon?: string
  fullWidth?: boolean
  style?: ViewStyle
}

export const Button: React.FC<ButtonProps> = ({
  text,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  fullWidth = false,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...styles[`button_${size}`],
    }

    if (fullWidth) {
      baseStyle.width = '100%'
    }

    if (disabled) {
      return { ...baseStyle, ...styles.buttonDisabled }
    }

    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: '#2563EB' }
      case 'secondary':
        return { ...baseStyle, backgroundColor: '#10B981' }
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: '#2563EB',
        }
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        }
      case 'danger':
        return { ...baseStyle, backgroundColor: '#EF4444' }
      default:
        return baseStyle
    }
  }

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...styles.buttonText,
      ...styles[`buttonText_${size}`],
    }

    if (disabled) {
      return { ...baseStyle, color: '#9CA3AF' }
    }

    if (variant === 'outline' || variant === 'ghost') {
      return { ...baseStyle, color: '#2563EB' }
    }

    return { ...baseStyle, color: '#FFFFFF' }
  }

  return (
    <Pressable
      style={({ pressed }) => [
        getButtonStyle(),
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={getTextStyle()}>{text}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  button_small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  button_medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  button_large: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  buttonText: {
    fontWeight: '600',
  },
  buttonText_small: {
    fontSize: 12,
  },
  buttonText_medium: {
    fontSize: 14,
  },
  buttonText_large: {
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
})
