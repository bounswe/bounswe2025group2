import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      height: '80%',
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      padding: 5,
    },
    modalBody: {
      flex: 1,
    },
    dateText: {
      fontSize: 14,
      marginBottom: 15,
      color: colors.text,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.text,
    },
    paragraph: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
      color: colors.text,
    },
    list: {
      marginLeft: 10,
    },
    listItem: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    bullet: {
      fontSize: 14,
      marginRight: 5,
      color: colors.text,
    },
    listItemText: {
      fontSize: 14,
      lineHeight: 20,
      flex: 1,
      color: colors.text,
    },
    footer: {
      marginTop: 20,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerText: {
      fontSize: 12,
      fontStyle: 'italic',
      textAlign: 'center',
      color: colors.subText || colors.text,
    }
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={styles.dateText}>
              <Text style={{fontWeight: 'bold'}}>Effective Date:</Text> December 15, 2025
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Introduction</Text>
              <Text style={styles.paragraph}>
                Welcome to GenFit ("the Platform"). We are committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
              </Text>
              <Text style={styles.paragraph}>
                This policy is designed to comply with the General Data Protection Regulation (GDPR) and the Law on the Protection of Personal Data (KVKK) in Turkey.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Data Controller</Text>
              <Text style={styles.paragraph}>
                The data controller for GenFit is the BounSwe Group 2 Team. If you have any questions about this policy, please contact us using the information provided in the "Contact Us" section.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Information We Collect</Text>
              <Text style={styles.paragraph}>
                We collect information that you provide directly to us, as well as information collected automatically when you use the Platform.
              </Text>
              <View style={styles.list}>
                {[
                  "Personal Information: Name, email address, username, and date of birth (for age verification).",
                  "Health and Fitness Data: Fitness goals, workout logs, physical activity data, and body metrics (e.g., weight, height). This is considered sensitive personal data and is processed with your explicit consent.",
                  "Usage Data: Information about how you interact with the app, features used, and time spent.",
                  "Device Information: Device type, operating system, and unique device identifiers."
                ].map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. How We Use Your Information</Text>
              <Text style={styles.paragraph}>
                We use the collected data for the following purposes:
              </Text>
              <View style={styles.list}>
                {[
                  "To provide, maintain, and improve our services, including fitness tracking and AI-powered suggestions.",
                  "To personalize your experience and provide tailored fitness advice.",
                  "To facilitate community features, such as forums, challenges, and leaderboards.",
                  "To communicate with you about updates, security alerts, and support.",
                  "To ensure the safety and security of our users, particularly minors.",
                  "To comply with legal obligations and enforce our Terms and Conditions."
                ].map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Legal Basis for Processing</Text>
              <Text style={styles.paragraph}>
                Under GDPR and KVKK, we process your data based on:
              </Text>
              <View style={styles.list}>
                {[
                  "Consent: You have given clear consent for us to process your personal data for a specific purpose (e.g., health data).",
                  "Contract: Processing is necessary for the performance of a contract (e.g., providing the app services).",
                  "Legitimate Interests: Processing is necessary for our legitimate interests (e.g., security, fraud prevention) unless there is a good reason to protect your personal data which overrides those legitimate interests.",
                  "Legal Obligation: Processing is necessary for compliance with a legal obligation."
                ].map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Data Sharing and Tracking</Text>
              <Text style={styles.paragraph}>
                We do not sell your personal data. We do not track you across third-party apps or websites, and we do not use your data for targeted advertising. We may share your information with:
              </Text>
              <View style={styles.list}>
                {[
                  "Coaches: If you choose to connect with a coach, they will have access to your fitness data to provide guidance.",
                  "Service Providers: Third-party vendors who provide services such as cloud hosting, data analysis, and AI processing. These providers are bound by confidentiality agreements.",
                  "Legal Authorities: If required by law or to protect the rights and safety of GenFit, our users, or others."
                ].map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. International Data Transfers</Text>
              <Text style={styles.paragraph}>
                Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ. We ensure appropriate safeguards, such as Standard Contractual Clauses, are in place for such transfers.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Data Retention</Text>
              <Text style={styles.paragraph}>
                We will retain your personal data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Your Rights (GDPR & KVKK)</Text>
              <Text style={styles.paragraph}>
                You have the following rights regarding your personal data:
              </Text>
              <View style={styles.list}>
                {[
                  "Right to Access: You have the right to request copies of your personal data.",
                  "Right to Rectification: You have the right to request that we correct any information you believe is inaccurate.",
                  "Right to Erasure: You have the right to request that we erase your personal data, under certain conditions.",
                  "Right to Restrict Processing: You have the right to request that we restrict the processing of your personal data.",
                  "Right to Object: You have the right to object to our processing of your personal data.",
                  "Right to Data Portability: You have the right to request that we transfer the data that we have collected to another organization, or directly to you.",
                  "Right to Withdraw Consent: You have the right to withdraw your consent at any time where GenFit relied on your consent to process your personal information."
                ].map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Children's Privacy</Text>
              <Text style={styles.paragraph}>
                GenFit is designed for youth sports, but we prioritize the safety of minors. We strongly recommend parental supervision for users under 18. We do not knowingly collect personally identifiable information from children under 13 without verifiable parental consent. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. Contact Us</Text>
              <Text style={styles.paragraph}>
                If you have any questions about this Privacy Policy, please contact us at:
              </Text>
              <Text style={styles.paragraph}>
                Email: bounswe.2025.02@gmail.com
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By using GenFit, you acknowledge that you have read and understood this Privacy Policy.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PrivacyPolicyModal;
