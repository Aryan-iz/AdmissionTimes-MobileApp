import React from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import {
  Header,
  StatsCard,
  Button,
  ListItem,
  ActionCard,
  SectionHeader,
} from '../components/ui'

/**
 * Example Screen demonstrating usage of all reusable UI components
 * This shows how to import and use the components across your app
 */
export const ExampleUsageScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header Component - Top navigation with notifications and profile */}
      <Header
        userName="Aryan Izhar"
        userRole="Admin"
        notifications={5}
        onNotificationPress={() => console.log('Notifications clicked')}
        onLogout={() => console.log('Logout clicked')}
      />

      <ScrollView style={styles.content}>
        {/* Section Header - Used for page/section titles */}
        <SectionHeader
          title="Dashboard Overview"
          subtitle="Welcome back! Here's your summary"
          actionText="View All"
          onActionPress={() => console.log('View All clicked')}
        />

        {/* Stats Cards Grid - Display metrics */}
        <View style={styles.statsGrid}>
          <StatsCard
            title="Total Users"
            value="1,234"
            icon="👥"
            iconColor="#2563EB"
            iconBgColor="#DBEAFE"
            style={styles.statsCard}
          />
          <StatsCard
            title="Active Programs"
            value="45"
            subtitle="this month"
            icon="🎓"
            iconColor="#10B981"
            iconBgColor="#D1FAE5"
            style={styles.statsCard}
          />
          <StatsCard
            title="Notifications"
            value="12"
            subtitle="unread"
            icon="🔔"
            iconColor="#F59E0B"
            iconBgColor="#FEF3C7"
            style={styles.statsCard}
          />
          <StatsCard
            title="Verified"
            value="89%"
            subtitle="completion"
            icon="✓"
            iconColor="#10B981"
            iconBgColor="#D1FAE5"
            style={styles.statsCard}
          />
        </View>

        {/* Section Header for Quick Actions */}
        <SectionHeader
          title="Quick Actions"
          style={styles.sectionSpacing}
        />

        {/* Action Cards - Interactive cards with icons */}
        <ActionCard
          title="Create New Admission"
          description="Add a new program admission"
          icon="➕"
          iconColor="#2563EB"
          iconBgColor="#E0E7FF"
          onPress={() => console.log('Create clicked')}
        />
        <ActionCard
          title="Verification Center"
          description="Review pending verifications"
          icon="✓"
          iconColor="#10B981"
          iconBgColor="#D1FAE5"
          onPress={() => console.log('Verify clicked')}
        />
        <ActionCard
          title="Analytics Dashboard"
          description="View detailed statistics"
          icon="📊"
          iconColor="#8B5CF6"
          iconBgColor="#EDE9FE"
          onPress={() => console.log('Analytics clicked')}
        />

        {/* Section Header for List Items */}
        <SectionHeader
          title="Recent Activities"
          actionText="See All"
          onActionPress={() => console.log('See All Activities')}
          style={styles.sectionSpacing}
        />

        {/* List Items - Display data with badges and actions */}
        <ListItem
          title="Computer Science Admission"
          subtitle="University of XYZ • Deadline: Jan 30, 2026"
          description="Bachelor's program with full scholarship available"
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
              onPress={() => console.log('View admission')}
            />
          }
          onPress={() => console.log('ListItem clicked')}
        />
        <ListItem
          title="Data Science Program"
          subtitle="ABC University • Deadline: Feb 15, 2026"
          description="Master's program with research opportunities"
          badge={{
            text: 'Pending',
            color: '#F59E0B',
            bgColor: '#FEF3C7',
          }}
          rightContent={
            <Button
              text="Edit"
              variant="ghost"
              size="small"
              onPress={() => console.log('Edit admission')}
            />
          }
        />
        <ListItem
          title="Software Engineering"
          subtitle="Tech Institute • Deadline: Expired"
          badge={{
            text: 'Closed',
            color: '#6B7280',
            bgColor: '#F3F4F6',
          }}
        />

        {/* Buttons Section */}
        <SectionHeader
          title="Button Variants"
          style={styles.sectionSpacing}
        />

        <View style={styles.buttonGroup}>
          <Button
            text="Primary Button"
            variant="primary"
            onPress={() => console.log('Primary')}
            style={styles.buttonSpacing}
          />
          <Button
            text="Secondary Button"
            variant="secondary"
            onPress={() => console.log('Secondary')}
            style={styles.buttonSpacing}
          />
          <Button
            text="Outline Button"
            variant="outline"
            onPress={() => console.log('Outline')}
            style={styles.buttonSpacing}
          />
          <Button
            text="Ghost Button"
            variant="ghost"
            onPress={() => console.log('Ghost')}
            style={styles.buttonSpacing}
          />
          <Button
            text="Danger Button"
            variant="danger"
            onPress={() => console.log('Danger')}
            style={styles.buttonSpacing}
          />
          <Button
            text="With Icon"
            icon="🚀"
            onPress={() => console.log('Icon button')}
            style={styles.buttonSpacing}
          />
          <Button
            text="Full Width Button"
            fullWidth
            onPress={() => console.log('Full width')}
            style={styles.buttonSpacing}
          />
          <Button
            text="Disabled Button"
            disabled
            onPress={() => console.log('Will not fire')}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    marginHorizontal: -6,
  },
  statsCard: {
    flex: 1,
    minWidth: '45%',
    margin: 6,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  buttonGroup: {
  },
  buttonSpacing: {
    marginBottom: 8,
  },
  bottomPadding: {
    height: 32,
  },
})

export default ExampleUsageScreen
