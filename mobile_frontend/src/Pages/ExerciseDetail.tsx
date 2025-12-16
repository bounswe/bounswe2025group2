import React from 'react';
import { View, StyleSheet, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import CustomText from '../components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { Exercise } from './Exercises';
import { useExerciseDbApi, type ExerciseDbItem, type ExerciseDbDetail } from '../services/exerciseDbApi';
import { ActivityIndicator } from 'react-native';

const ExerciseDetail = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const { exercise, exerciseDb } = route.params as {
    exercise?: Exercise;
    exerciseDb?: ExerciseDbItem;
  };

  const { getExerciseDetail } = useExerciseDbApi();
  const [dbDetail, setDbDetail] = React.useState<ExerciseDbDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const isDbExercise = !!exerciseDb;
  const baseExercise = exerciseDb || (exercise as Exercise | undefined);

  React.useEffect(() => {
    const loadDetail = async () => {
      if (!exerciseDb) return;
      setIsLoadingDetail(true);
      setDetailError(null);
      try {
        const response = await getExerciseDetail(exerciseDb.exerciseId);
        setDbDetail(response.data);
      } catch (error: any) {
        setDetailError(error?.message || 'Failed to load full details. Please try again.');
      } finally {
        setIsLoadingDetail(false);
      }
    };

    if (exerciseDb) {
      loadDetail();
    }
  }, [exerciseDb, getExerciseDetail]);

  if (!baseExercise) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: '#ffffff' }]}
        contentContainerStyle={styles.content}
      >
        <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
          Exercise not found
        </CustomText>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#ffffff' }]}
      contentContainerStyle={styles.content}
    >
      {/* Image for ExerciseDB exercises */}
      {isDbExercise && (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: dbDetail?.imageUrl || (baseExercise as ExerciseDbItem).imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.header}>
        <CustomText style={[styles.title, { color: colors.text }]}>
          {baseExercise.name}
        </CustomText>
        {exercise && 'difficulty' in exercise && (
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
        )}
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
          Description
        </CustomText>
        <CustomText style={[styles.sectionContent, { color: colors.subText }]}>
          {'description' in baseExercise ? baseExercise.description : ''}
        </CustomText>
      </View>

      {/* Overview from ExerciseDB detail (if available) */}
      {dbDetail?.overview && (
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Overview
          </CustomText>
          <CustomText style={[styles.sectionContent, { color: colors.subText }]}>
            {dbDetail.overview}
          </CustomText>
        </View>
      )}

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
          Muscle Groups
        </CustomText>
        <View style={styles.muscleGroupsContainer}>
          {'muscleGroups' in baseExercise &&
            baseExercise.muscleGroups.map((muscle, index) => (
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

      {'equipment' in baseExercise && baseExercise.equipment && (
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Equipment
          </CustomText>
          <CustomText style={[styles.sectionContent, { color: colors.subText }]}>
            {baseExercise.equipment}
          </CustomText>
        </View>
      )}

      {/* Local glossary instructions */}
      {'instructions' in baseExercise &&
        baseExercise.instructions &&
        baseExercise.instructions.length > 0 && (
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Instructions
          </CustomText>
          {baseExercise.instructions.map((instruction, index) => (
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

      {/* ExerciseDB detailed instructions */}
      {dbDetail?.instructions && dbDetail.instructions.length > 0 && (
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Step-by-Step Instructions
          </CustomText>
          {dbDetail.instructions.map((instruction, index) => (
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

      {/* Local glossary tips */}
      {'tips' in baseExercise && baseExercise.tips && (
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Tips
          </CustomText>
          <View style={[styles.tipsContainer, { backgroundColor: colors.navBar }]}>
            <CustomText style={[styles.tipsText, { color: colors.subText }]}>
              {baseExercise.tips}
            </CustomText>
          </View>
        </View>
      )}

      {/* ExerciseDB tips */}
      {dbDetail?.exerciseTips && dbDetail.exerciseTips.length > 0 && (
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Pro Tips & Safety
          </CustomText>
          <View style={[styles.tipsContainer, { backgroundColor: colors.navBar }]}>
            {dbDetail.exerciseTips.map((tip, index) => (
              <CustomText
                key={index}
                style={[styles.tipsText, { color: colors.subText, marginBottom: 4 }]}
              >
                • {tip}
              </CustomText>
            ))}
          </View>
        </View>
      )}

      {/* ExerciseDB variations */}
      {dbDetail?.variations && dbDetail.variations.length > 0 && (
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Exercise Variations
          </CustomText>
          {dbDetail.variations.map((variation, index) => (
            <CustomText
              key={index}
              style={[styles.sectionContent, { color: colors.subText, marginBottom: 4 }]}
            >
              • {variation}
            </CustomText>
          ))}
        </View>
      )}

      {/* ExerciseDB video link */}
      {dbDetail?.videoUrl && dbDetail.videoUrl !== 'string' && (
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Video Tutorial
          </CustomText>
          <TouchableOpacity
            onPress={() => Linking.openURL(dbDetail.videoUrl as string)}
            style={styles.videoButton}
          >
            <CustomText style={styles.videoButtonText}>
              Watch Video Tutorial
            </CustomText>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading state for ExerciseDB detail */}
      {isDbExercise && isLoadingDetail && (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color="#800000" />
        </View>
      )}

      {/* Detail error */}
      {isDbExercise && detailError && (
        <View style={styles.detailErrorSection}>
          <CustomText style={[styles.detailErrorText, { color: '#b91c1c' }]}>
            {detailError}
          </CustomText>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageWrapper: {
    width: '100%',
    height: 220,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  image: {
    width: '100%',
    height: '100%',
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
  videoButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#800000',
    alignSelf: 'flex-start',
  },
  videoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSection: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  detailErrorSection: {
    paddingVertical: 8,
  },
  detailErrorText: {
    fontSize: 14,
  },
});

export default ExerciseDetail;

