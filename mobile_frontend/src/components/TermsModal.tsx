import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose }) => {
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
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={styles.dateText}>
              <Text style={{fontWeight: 'bold'}}>Effective Date:</Text> November 24, 2025
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.paragraph}>
                By accessing or using GenFit ("the Platform"), you agree to be bound by these Terms
                and Conditions. If you do not agree to these terms, please do not use our services.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Platform Purpose</Text>
              <Text style={styles.paragraph}>
                GenFit is a youth sports and fitness platform designed to connect young individuals
                with local sports programs, fitness challenges, coaches, and a supportive community
                to promote healthy and active lifestyles.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. User Eligibility</Text>
              <Text style={styles.paragraph}>
                Users must provide accurate information during registration. For users under 18,
                parental consent and supervision are strongly recommended. Coaches must provide
                verification documentation to obtain coach status.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Health and Safety</Text>
              <Text style={styles.paragraph}>
                <Text style={{fontWeight: 'bold'}}>Important:</Text> GenFit provides fitness guidance and AI-powered suggestions,
                but we are not a substitute for professional medical advice. Users should:
              </Text>
              <View style={styles.list}>
                {[
                  "Consult healthcare professionals before starting any fitness program",
                  "Listen to their body and stop any activity that causes pain or discomfort",
                  "Follow safe and realistic fitness goals as recommended by our platform",
                  "Report any unsafe content or coaching practices immediately"
                ].map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. User Responsibilities</Text>
              <Text style={styles.paragraph}>Users agree to:</Text>
              <View style={styles.list}>
                {[
                  "Provide accurate and truthful information",
                  "Maintain the confidentiality of their account credentials",
                  "Use the platform respectfully and not engage in bullying or harassment",
                  "Not share inappropriate content or promote harmful behaviors",
                  "Respect intellectual property rights and not copy or distribute platform content"
                ].map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Coach Responsibilities</Text>
              <Text style={styles.paragraph}>Verified coaches must:</Text>
              <View style={styles.list}>
                {[
                  "Provide safe, age-appropriate fitness guidance",
                  "Maintain professional boundaries with all users",
                  "Report any concerns about user safety or wellbeing",
                  "Hold valid certifications and credentials as required by local regulations"
                ].map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Community Guidelines</Text>
              <Text style={styles.paragraph}>
                GenFit is committed to maintaining a positive, supportive environment. We prohibit:
              </Text>
              <View style={styles.list}>
                {[
                  "Promotion of unhealthy or dangerous fitness practices",
                  "Body shaming, bullying, or discriminatory behavior",
                  "Sharing of false or misleading health information",
                  "Commercial solicitation without platform authorization"
                ].map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. AI-Powered Features</Text>
              <Text style={styles.paragraph}>
                Our platform uses AI to provide goal suggestions, daily advice, and personalized
                recommendations. While we strive for accuracy, AI suggestions should be considered
                as guidance only and not as professional medical advice.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Data and Privacy</Text>
              <Text style={styles.paragraph}>
                We collect and process user data including fitness goals, progress tracking,
                community interactions, and profile information. We are committed to protecting
                your privacy and will not sell your personal data to third parties.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Challenges and Competitions</Text>
              <Text style={styles.paragraph}>
                Participation in fitness challenges and leaderboards is voluntary. Users should
                only participate in challenges appropriate for their fitness level and should
                prioritize safety over competition.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. Content Ownership</Text>
              <Text style={styles.paragraph}>
                Users retain ownership of content they post but grant GenFit a license to use,
                display, and share such content on the platform. Users are responsible for ensuring
                they have rights to any content they upload.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12. Limitation of Liability</Text>
              <Text style={styles.paragraph}>
                GenFit is not liable for injuries, health issues, or damages resulting from use
                of the platform or participation in fitness activities. Users assume all risks
                associated with physical activities.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>13. Account Termination</Text>
              <Text style={styles.paragraph}>
                We reserve the right to suspend or terminate accounts that violate these terms,
                engage in harmful behavior, or pose risks to the community. Users may delete their
                accounts at any time through account settings.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>14. Changes to Terms</Text>
              <Text style={styles.paragraph}>
                GenFit reserves the right to update these Terms and Conditions. Users will be
                notified of significant changes and continued use of the platform constitutes
                acceptance of updated terms.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>15. Contact Information</Text>
              <Text style={styles.paragraph}>
                For questions, concerns, or to report violations of these terms, please contact
                our support team through the platform or visit our community forums.
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By signing up and signing in, you acknowledge that you have read,
                understood, and agree to be bound by the Terms and Conditions.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default TermsModal;
