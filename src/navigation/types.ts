export type RootStackParamList = {
  Login: undefined
  SignUp: undefined
  StudentDashboard: undefined
  StudentSearch: undefined
  StudentCompare: { ids?: string[] } | undefined
  StudentDeadlines: undefined
  StudentWatchlist: undefined
  StudentNotifications: undefined
  ProgramDetail: { id: string }
}
