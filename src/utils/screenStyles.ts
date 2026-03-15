import { StyleSheet } from 'react-native'
import { theme } from '../theme'

export const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    marginTop: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  muted: {
    color: theme.colors.textMuted,
  },
})
