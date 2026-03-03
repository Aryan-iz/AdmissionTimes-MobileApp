import { useState, useMemo, useRef } from 'react'
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { useUniversityStore } from '../../store'
import { getStatusColor, Admission } from '../../data/universityData'
import { TitleHeader } from '../../components/ui'
import * as DocumentPicker from 'expo-document-picker'

type ManageAdmissionsNavigationProp = StackNavigationProp<RootStackParamList, 'ManageAdmissions'>

type UploadedFile = {
  name: string
  size: number
  uri: string
}

export default function ManageAdmissionsScreen() {
  const navigation = useNavigation<ManageAdmissionsNavigationProp>()
  const admissions = useUniversityStore(state => state.admissions)
  const createOrUpdateAdmission = useUniversityStore(state => state.createOrUpdateAdmission)
  const deleteAdmission = useUniversityStore(state => state.deleteAdmission)

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    programTitle: 'Bachelor of Science in Computer Science',
    degreeType: 'BS',
    department: 'School of Engineering',
    academicYear: '2025-2026',
    applicationDeadline: '',
    fee: '2500',
    overview: '',
    eligibility: '',
    websiteUrl: 'https://university.edu',
    admissionPortalLink: 'https://university.edu/admissions',
  })

  const recentAdmissions = useMemo(() => {
    return [...admissions]
      .sort((a, b) => (b.lastAction || '').localeCompare(a.lastAction || ''))
      .slice(0, 5)
  }, [admissions])

  // Mock function to extract data from PDF
  const extractDataFromPDF = async (): Promise<Partial<typeof formData>> => {
    // Simulate API call delay
    await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
    
    // Mock extracted data
    return {
      programTitle: 'Bachelor of Science in Computer Science',
      degreeType: 'BS',
      department: 'School of Engineering and Computer Science',
      academicYear: '2025-2026',
      applicationDeadline: '2025-07-15',
      fee: '5000',
      overview: 'This program provides comprehensive training in computer science fundamentals, software engineering, and modern technologies. Students will gain hands-on experience through projects and internships.',
      eligibility: 'Minimum 60% marks in F.Sc/ICS/A-Level or equivalent. Entry test required. Mathematics and Physics background preferred.',
      websiteUrl: 'https://university.edu/cs',
      admissionPortalLink: 'https://university.edu/admissions/cs',
    }
  }

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      })

      if (result.canceled) {
        return
      }

      const file = result.assets[0]
      
      // Validate file size (max 10MB)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 10MB.')
        return
      }

      setUploadedFile({
        name: file.name,
        size: file.size || 0,
        uri: file.uri,
      })

      // Process the file
      setIsProcessing(true)
      setExtractionStatus('Processing PDF and extracting information...')

      try {
        const extractedData = await extractDataFromPDF()
        
        // Auto-fill form with extracted data
        setFormData(prev => ({
          ...prev,
          ...extractedData,
        }))
        
        setExtractionStatus('Information extracted successfully! Please review and edit as needed.')
        
        // Clear status after 5 seconds
        setTimeout(() => {
          setExtractionStatus(null)
        }, 5000)
      } catch (error) {
        setExtractionStatus('Error processing PDF. Please fill the form manually.')
        console.error('PDF extraction error:', error)
      } finally {
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Document picker error:', error)
      Alert.alert('Error', 'Failed to pick document')
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setExtractionStatus(null)
  }

  const buildAdmissionPayload = (statusOverride?: Admission['status']): Admission => {
    const now = new Date()
    const lastAction = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours(),
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    return {
      id: `adm-${Date.now()}`,
      title: formData.programTitle,
      deadline: formData.applicationDeadline,
      status: statusOverride ?? 'Pending Audit',
      views: '0',
      verifiedBy: undefined,
      lastAction,
      remarks: 'Awaiting admin review',
      degreeType: formData.degreeType,
      department: formData.department,
      academicYear: formData.academicYear,
      fee: formData.fee,
      overview: formData.overview,
      eligibility: formData.eligibility,
      websiteUrl: formData.websiteUrl,
      admissionPortalLink: formData.admissionPortalLink,
    }
  }

  const handleSaveDraft = () => {
    const draft = buildAdmissionPayload('Draft')
    createOrUpdateAdmission(draft, { diff: [], modifiedBy: 'Rep_01' })
    Alert.alert('Success', 'Draft saved successfully!')
  }

  const handlePublish = () => {
    if (!formData.programTitle || !formData.applicationDeadline) {
      Alert.alert('Error', 'Please fill in required fields: Program Title and Application Deadline')
      return
    }

    const payload = buildAdmissionPayload()
    createOrUpdateAdmission(payload, { diff: [], modifiedBy: 'Rep_01' })

    Alert.alert('Success', `Admission "${formData.programTitle}" published successfully!`, [
      { text: 'OK', onPress: () => navigation.navigate('UniversityDashboard') }
    ])
  }

  const handleDeleteRecent = (id: string, title: string) => {
    Alert.alert(
      'Delete Admission',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteAdmission(id)
            Alert.alert('Deleted', 'Admission deleted successfully!')
          }
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      <TitleHeader title="Manage Admissions" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Add new admissions or update existing listings. Records are auto-published as Pending Audit.
          </Text>

          {/* PDF/Brochure Upload Section */}
          <View style={styles.uploadCard}>
            <View style={styles.uploadHeader}>
              <Text style={styles.uploadIcon}>📄</Text>
              <View style={styles.uploadHeaderText}>
                <Text style={styles.uploadTitle}>Upload PDF/Brochure (Optional)</Text>
                <Text style={styles.uploadSubtitle}>
                  Upload a PDF to automatically extract and fill admission information. Max 10MB.
                </Text>
              </View>
            </View>

            {!uploadedFile ? (
              <View style={styles.uploadActions}>
                <Pressable
                  style={[styles.uploadButton, isProcessing && styles.uploadButtonDisabled]}
                  onPress={handleFileUpload}
                  disabled={isProcessing}
                >
                  <Text style={styles.uploadButtonText}>
                    {isProcessing ? 'Processing...' : 'Choose PDF File'}
                  </Text>
                </Pressable>
                <Text style={styles.uploadHint}>Supported: PDF (max 10MB)</Text>
              </View>
            ) : (
              <View style={styles.filePreview}>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileIcon}>📑</Text>
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>{uploadedFile.name}</Text>
                    <Text style={styles.fileSize}>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</Text>
                  </View>
                </View>
                <Pressable
                  style={[styles.removeButton, isProcessing && styles.removeButtonDisabled]}
                  onPress={handleRemoveFile}
                  disabled={isProcessing}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>
              </View>
            )}

            {isProcessing && (
              <View style={styles.processingBar}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.processingText}>Extracting information from PDF...</Text>
              </View>
            )}

            {extractionStatus && !isProcessing && (
              <View style={[
                styles.statusBar,
                extractionStatus.includes('Error') ? styles.statusBarError : styles.statusBarSuccess
              ]}>
                <Text style={[
                  styles.statusText,
                  extractionStatus.includes('Error') ? styles.statusTextError : styles.statusTextSuccess
                ]}>
                  {extractionStatus}
                </Text>
              </View>
            )}
          </View>

          {/* Info Banners */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>AI Summary Generated</Text>
              <Text style={styles.infoSubtitle}>automatically after submission.</Text>
            </View>
          </View>

          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>All published admissions</Text>
              <Text style={styles.infoSubtitle}>are set to 'Pending Audit' by default.</Text>
            </View>
          </View>

          {/* Basic Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Details</Text>
            
            <Text style={styles.label}>Program Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.programTitle}
              onChangeText={(text) => setFormData({ ...formData, programTitle: text })}
              placeholder="Enter program title"
            />

            <Text style={styles.label}>Degree Type *</Text>
            <View style={styles.degreeTypeContainer}>
              {['BS', 'MS', 'PhD', 'MBA'].map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.degreeTypeButton,
                    formData.degreeType === type && styles.degreeTypeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, degreeType: type })}
                >
                  <Text style={[
                    styles.degreeTypeText,
                    formData.degreeType === type && styles.degreeTypeTextActive
                  ]}>{type}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Department/Discipline</Text>
            <TextInput
              style={styles.input}
              value={formData.department}
              onChangeText={(text) => setFormData({ ...formData, department: text })}
              placeholder="Enter department"
            />

            <Text style={styles.label}>Academic Year</Text>
            <TextInput
              style={styles.input}
              value={formData.academicYear}
              onChangeText={(text) => setFormData({ ...formData, academicYear: text })}
              placeholder="2025-2026"
            />

            <Text style={styles.label}>Application Deadline *</Text>
            <TextInput
              style={styles.input}
              value={formData.applicationDeadline}
              onChangeText={(text) => setFormData({ ...formData, applicationDeadline: text })}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Fee (Rs)</Text>
            <TextInput
              style={styles.input}
              value={formData.fee}
              onChangeText={(text) => setFormData({ ...formData, fee: text })}
              placeholder="Enter fee amount"
              keyboardType="numeric"
            />
          </View>

          {/* Program Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Program Information</Text>
            
            <Text style={styles.label}>Overview</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.overview}
              onChangeText={(text) => setFormData({ ...formData, overview: text })}
              placeholder="Provide a brief summary of the program..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Eligibility */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Eligibility</Text>
            
            <Text style={styles.label}>Eligibility Criteria</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.eligibility}
              onChangeText={(text) => setFormData({ ...formData, eligibility: text })}
              placeholder="List the eligibility criteria..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Official Links */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Official Links</Text>
            
            <Text style={styles.label}>University Website URL</Text>
            <TextInput
              style={styles.input}
              value={formData.websiteUrl}
              onChangeText={(text) => setFormData({ ...formData, websiteUrl: text })}
              placeholder="https://university.edu"
              keyboardType="url"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Admission Portal Link</Text>
            <TextInput
              style={styles.input}
              value={formData.admissionPortalLink}
              onChangeText={(text) => setFormData({ ...formData, admissionPortalLink: text })}
              placeholder="https://university.edu/admissions"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable style={styles.draftButton} onPress={handleSaveDraft}>
              <Text style={styles.draftButtonText}>Save as Draft</Text>
            </Pressable>
            <Pressable style={styles.publishButton} onPress={handlePublish}>
              <Text style={styles.publishButtonText}>Publish Admission</Text>
            </Pressable>
          </View>

          {/* Recent Admissions */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Admissions</Text>
            {recentAdmissions.length === 0 ? (
              <Text style={styles.emptyText}>No admissions yet</Text>
            ) : (
              recentAdmissions.map((admission) => {
                const statusColors = getStatusColor(admission.status)
                return (
                  <View key={admission.id} style={styles.admissionItem}>
                    <View style={styles.admissionHeader}>
                      <Text style={styles.admissionTitle} numberOfLines={2}>
                        {admission.title}
                      </Text>
                      <Pressable
                        onPress={() => handleDeleteRecent(admission.id, admission.title)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.admissionDeadline}>Deadline: {admission.deadline}</Text>
                    <View style={styles.admissionStatus}>
                      <View style={[styles.statusDot, { backgroundColor: statusColors.bg }]} />
                      <Text style={[styles.statusText, { color: statusColors.text }]}>
                        {admission.status}
                      </Text>
                    </View>
                    {admission.verifiedBy && (
                      <Text style={styles.verifiedText}>Verified by {admission.verifiedBy}</Text>
                    )}
                  </View>
                )
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  uploadIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  uploadHeaderText: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  uploadActions: {
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  filePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  removeButtonDisabled: {
    opacity: 0.5,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#DC2626',
  },
  processingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginBottom: 12,
  },
  processingText: {
    fontSize: 13,
    color: '#2563EB',
    marginLeft: 12,
  },
  statusBar: {
    padding: 12,
    borderRadius: 8,
  },
  statusBarSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statusBarError: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 13,
  },
  statusTextSuccess: {
    color: '#065F46',
  },
  statusTextError: {
    color: '#991B1B',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 12,
    color: '#1E40AF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 120,
    paddingTop: 10,
  },
  degreeTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  degreeTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  degreeTypeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  degreeTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  degreeTypeTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  draftButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginRight: 8,
  },
  draftButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  publishButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    marginLeft: 8,
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 24,
  },
  admissionItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  admissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  admissionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  admissionDeadline: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  admissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
})
