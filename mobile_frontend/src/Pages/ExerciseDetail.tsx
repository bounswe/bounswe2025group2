import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import CustomText from '../components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { Exercise } from './Exercises';

const ExerciseDetail = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const { exercise } = route.params as { exercise: Exercise };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#ffffff' }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <CustomText style={[styles.title, { color: colors.text }]}>
          {exercise.name}
        </CustomText>
        <View
          style={[
            styles.difficultyBadge,
            {
              backgroundColor:
                exercise.difficulty === 'Beginner'
                  ? '#d1fae5'
                  : exercise.difficulty === 'Intermediate'
                  ? '#fef3c7'
                  : '#fee2e2',
            },
          ]}
        >
          <CustomText
            style={[
              styles.difficultyText,
              {
                color:
                  exercise.difficulty === 'Beginner'
                    ? '#10b981'
                    : exercise.difficulty === 'Intermediate'
                    ? '#f59e0b'
                    : '#ef4444',
              },
            ]}
          >
            {exercise.difficulty}
          </CustomText>
        </View>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
          Description
        </CustomText>
        <CustomText style={[styles.sectionContent, { color: colors.subText }]}>
          {exercise.description}
        </CustomText>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
          Muscle Groups
        </CustomText>
        <View style={styles.muscleGroupsContainer}>
          {exercise.muscleGroups.map((muscle, index) => (
            <View
              key={index}
              style={[styles.muscleTag, { backgroundColor: colors.navBar }]}
            >
              <CustomText style={[styles.muscleText, { color: colors.subText }]}>
                {muscle}
              </CustomText>
            </View>
          ))}
        </View>
      </View>

      {exercise.equipment && (
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Equipment
          </CustomText>
          <CustomText style={[styles.sectionContent, { color: colors.subText }]}>
            {exercise.equipment}
          </CustomText>
        </View>
      )}

      {exercise.instructions && exercise.instructions.length > 0 && (
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Instructions
          </CustomText>
          {exercise.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: colors.border }]}>
                <CustomText style={[styles.stepNumberText, { color: '#ffffff' }]}>
                  {index + 1}
                </CustomText>
              </View>
              <CustomText
                style={[styles.instructionText, { color: colors.subText }]}
              >
                {instruction}
              </CustomText>
            </View>
          ))}
        </View>
      )}

      {exercise.tips && (
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Tips
          </CustomText>
          <View style={[styles.tipsContainer, { backgroundColor: colors.navBar }]}>
            <CustomText style={[styles.tipsText, { color: colors.subText }]}>
              {exercise.tips}
            </CustomText>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  muscleGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  muscleText: {
    fontSize: 14,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  tipsText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});

export default ExerciseDetail;

