import 'react-native-gesture-handler'

import { NavigationContainer } from '@react-navigation/native'
import { View, StatusBar } from 'react-native'

import { AuthProvider } from './src/contexts/AuthContext.tsx'
import { StudentDataProvider } from './src/contexts/StudentDataContext.tsx'
import { UniversityDataProvider } from './src/contexts/UniversityDataContext.tsx'
import { AiProvider } from './src/contexts/AiContext.tsx'
import AppNavigator from './src/navigation/AppNavigator.tsx'

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar />
      <AuthProvider>
        <StudentDataProvider>
          <UniversityDataProvider>
            <AiProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </AiProvider>
          </UniversityDataProvider>
        </StudentDataProvider>
      </AuthProvider>
    </View>
  )
}
