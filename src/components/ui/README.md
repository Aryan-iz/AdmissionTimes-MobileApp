# Reusable UI Components

This directory contains reusable React Native UI components converted from the web project. These components maintain visual consistency with the web app while using native React Native primitives.

## Components Overview

### 1. Header
**Purpose:** Top navigation bar with notifications and profile dropdown

**Props:**
```typescript
interface HeaderProps {
  userName?: string        // Display name (default: 'User')
  userRole?: string        // User role label (default: 'Student')
  notifications?: number   // Notification count badge (default: 0)
  onNotificationPress?: () => void  // Notification bell handler
  onLogout?: () => void    // Custom logout handler
}
```

**Usage:**
```tsx
import { Header } from '../components/ui'

<Header
  userName="Aryan Izhar"
  userRole="Admin"
  notifications={5}
  onNotificationPress={() => navigate('Notifications')}
/>
```

**Features:**
- Notification badge with count
- Profile avatar with initials
- Dropdown menu with logout
- Modal overlay for profile menu

---

### 2. StatsCard
**Purpose:** Display metric cards with icons

**Props:**
```typescript
interface StatsCardProps {
  title: string           // Card title/label
  value: string | number  // Main metric value
  subtitle?: string       // Optional subtitle text
  icon?: string          // Emoji/Unicode icon (default: '📊')
  iconColor?: string     // Icon text color (default: '#2563EB')
  iconBgColor?: string   // Icon background color (default: '#E0E7FF')
  style?: ViewStyle      // Custom styles
}
```

**Usage:**
```tsx
import { StatsCard } from '../components/ui'

<StatsCard
  title="Total Users"
  value="1,234"
  subtitle="this month"
  icon="👥"
  iconColor="#2563EB"
  iconBgColor="#DBEAFE"
/>
```

**Best For:**
- Dashboard metrics
- KPI displays
- Statistics overview

---

### 3. Button
**Purpose:** Reusable action buttons with multiple variants

**Props:**
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'small' | 'medium' | 'large'

interface ButtonProps {
  text: string            // Button label
  onPress: () => void     // Click handler
  variant?: ButtonVariant // Style variant (default: 'primary')
  size?: ButtonSize       // Size preset (default: 'medium')
  disabled?: boolean      // Disabled state (default: false)
  icon?: string          // Optional icon (emoji/unicode)
  fullWidth?: boolean    // Full width mode (default: false)
  style?: ViewStyle      // Custom styles
}
```

**Usage:**
```tsx
import { Button } from '../components/ui'

// Primary button
<Button
  text="Submit"
  onPress={handleSubmit}
/>

// Outline button with icon
<Button
  text="Search"
  variant="outline"
  icon="🔍"
  onPress={handleSearch}
/>

// Full width button
<Button
  text="Continue"
  fullWidth
  onPress={handleContinue}
/>
```

**Variants:**
- `primary`: Blue background, white text
- `secondary`: Green background, white text
- `outline`: Transparent with blue border
- `ghost`: Transparent, no border
- `danger`: Red background, white text

**Sizes:**
- `small`: 12px padding, 12px font
- `medium`: 16px padding, 14px font (default)
- `large`: 24px padding, 16px font

---

### 4. ListItem
**Purpose:** Display list rows with title, subtitle, badges, and actions

**Props:**
```typescript
interface ListItemProps {
  title: string           // Main title text
  subtitle?: string       // Secondary text line
  description?: string    // Tertiary description (2 lines max)
  badge?: {               // Status badge
    text: string
    color: string        // Text color
    bgColor: string      // Background color
  }
  rightContent?: React.ReactNode  // Right-aligned content
  onPress?: () => void    // Makes item pressable
  style?: ViewStyle       // Custom styles
}
```

**Usage:**
```tsx
import { ListItem, Button } from '../components/ui'

<ListItem
  title="Computer Science Admission"
  subtitle="University XYZ • Deadline: Jan 30"
  description="Bachelor's program with scholarship"
  badge={{
    text: 'Active',
    color: '#10B981',
    bgColor: '#D1FAE5',
  }}
  rightContent={
    <Button
      text="View"
      variant="outline"
      size="small"
      onPress={handleView}
    />
  }
  onPress={() => navigate('Detail', { id: admission.id })}
/>
```

**Best For:**
- Admission lists
- Notification items
- Activity feeds
- Search results

---

### 5. ActionCard
**Purpose:** Interactive cards for navigation and quick actions

**Props:**
```typescript
interface ActionCardProps {
  title: string           // Action title
  description?: string    // Optional description
  icon?: string          // Emoji/Unicode icon (default: '⚡')
  iconColor?: string     // Icon color (default: '#2563EB')
  iconBgColor?: string   // Icon background (default: '#E0E7FF')
  onPress: () => void    // Click handler
  style?: ViewStyle      // Custom styles
}
```

**Usage:**
```tsx
import { ActionCard } from '../components/ui'

<ActionCard
  title="Create New Admission"
  description="Add a new program admission"
  icon="➕"
  iconColor="#2563EB"
  iconBgColor="#E0E7FF"
  onPress={() => navigate('ManageAdmissions')}
/>
```

**Best For:**
- Quick action menus
- Dashboard shortcuts
- Navigation cards
- Feature discovery

---

### 6. SectionHeader
**Purpose:** Section titles with optional action buttons

**Props:**
```typescript
interface SectionHeaderProps {
  title: string           // Section title
  subtitle?: string       // Optional subtitle
  actionText?: string     // Action button label
  onActionPress?: () => void  // Action button handler
  style?: ViewStyle       // Custom styles
}
```

**Usage:**
```tsx
import { SectionHeader } from '../components/ui'

// Simple header
<SectionHeader
  title="Dashboard Overview"
  subtitle="Welcome back! Here's your summary"
/>

// Header with action
<SectionHeader
  title="Recent Activities"
  actionText="View All"
  onActionPress={() => navigate('AllActivities')}
/>
```

**Best For:**
- Page headers
- Section dividers
- Content organization

---

## Import Patterns

### Single Component
```tsx
import { Button } from '../components/ui'
```

### Multiple Components
```tsx
import { Header, StatsCard, Button, ListItem } from '../components/ui'
```

### All Components
```tsx
import * as UI from '../components/ui'

<UI.Button text="Submit" onPress={handleSubmit} />
```

---

## Styling Guide

### Custom Styles
All components accept a `style` prop for customization:

```tsx
<StatsCard
  title="Users"
  value="100"
  style={{ marginBottom: 20, borderColor: '#FF0000' }}
/>
```

### Color Palette (from web project)
- Primary Blue: `#2563EB`
- Success Green: `#10B981`
- Warning Yellow: `#F59E0B`
- Danger Red: `#EF4444`
- Gray (text): `#6B7280`, `#9CA3AF`
- Dark (headings): `#111827`
- Light backgrounds: `#F9FAFB`, `#E0E7FF`, `#D1FAE5`

### Layout Patterns

**Grid of Stats Cards:**
```tsx
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
  <StatsCard title="Users" value="100" style={{ flex: 1, minWidth: '45%' }} />
  <StatsCard title="Programs" value="50" style={{ flex: 1, minWidth: '45%' }} />
</View>
```

**Vertical List:**
```tsx
<ScrollView>
  <ListItem title="Item 1" />
  <ListItem title="Item 2" />
  <ListItem title="Item 3" />
</ScrollView>
```

**Action Menu:**
```tsx
<View>
  <ActionCard title="Action 1" onPress={handler1} />
  <ActionCard title="Action 2" onPress={handler2} />
  <ActionCard title="Action 3" onPress={handler3} />
</View>
```

---

## Integration with Existing Code

### Using with Context Data
```tsx
import { useStudentData } from '../contexts/StudentDataContext'
import { StatsCard, ListItem } from '../components/ui'

function MyScreen() {
  const { admissions } = useStudentData()
  
  return (
    <>
      <StatsCard
        title="Total Admissions"
        value={admissions.length}
      />
      
      {admissions.map(admission => (
        <ListItem
          key={admission.id}
          title={admission.programName}
          subtitle={admission.universityName}
          badge={{
            text: admission.status,
            color: getStatusColor(admission.status),
            bgColor: getStatusBgColor(admission.status),
          }}
        />
      ))}
    </>
  )
}
```

### Navigation Integration
```tsx
import { useNavigation } from '@react-navigation/native'
import { ActionCard, Button } from '../components/ui'

function Dashboard() {
  const navigation = useNavigation()
  
  return (
    <>
      <ActionCard
        title="View Admissions"
        onPress={() => navigation.navigate('ManageAdmissions')}
      />
      
      <Button
        text="Create New"
        onPress={() => navigation.navigate('ManageAdmissions', { mode: 'create' })}
      />
    </>
  )
}
```

---

## Best Practices

1. **Consistent Sizing**: Use the predefined size props instead of custom styles
2. **Color Theme**: Stick to the color palette for visual consistency
3. **Icons**: Use emoji/Unicode for simple icons (works cross-platform)
4. **Accessibility**: Provide meaningful text for screen readers
5. **Performance**: Memoize complex ListItem renders with `React.memo()`
6. **Spacing**: Use consistent margins (12px, 16px, 24px)

---

## Example Screen

See `mobile/src/screens/ExampleUsageScreen.tsx` for a comprehensive demonstration of all components in action.

---

## Component Comparison: Web vs Mobile

| Web Element | React Native Component | Notes |
|------------|----------------------|-------|
| `<div>` | `<View>` | Container element |
| `<p>`, `<h1>`, `<span>` | `<Text>` | All text content |
| `<button>` | `<Pressable>` / `<Button>` | Interactive elements |
| `<ul>`, `<li>` | `<FlatList>` / `<ListItem>` | Lists |
| CSS classes | `StyleSheet` | Inline or StyleSheet |
| `onClick` | `onPress` | Event handler |
| Tailwind classes | React Native styles | No direct equivalent |

---

## Troubleshooting

**Component not rendering:**
- Ensure proper import path
- Check that parent container has flex or height set

**Styles not applying:**
- Verify style object format (camelCase properties)
- Check for conflicting styles in parent components

**Press handlers not working:**
- Ensure `onPress` is passed correctly
- Check if component is inside a `ScrollView` (may need `pointerEvents`)

**Layout issues:**
- Use `flex: 1` on containers
- Set explicit width/height when needed
- Test on both iOS and Android
