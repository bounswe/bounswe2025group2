import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Thread from '../components/Thread';
import { useThreads } from '../context/ThreadContext';
import { useTheme } from '../context/ThemeContext';

// Keep this as fallback if no threads are available
const sampleThreads = [
  {
    id: 1,
    forumName: "MenteesPostingTheirWs",
    content: "@NextGenBaller you was right, having a real coach feel like a cheat code. \nBeen training with @CoachMalik for a while now, and I see big difference. Footwork better, I don't get tired so fast, and now I actually think before I make a play, not just run and hope. \nFew months ago, I was just playing, not really knowing what I do. Now I beat guys who used to be way better than me. Coach make me see the game different, not just skills but how to play smart.",
    imageUrl: require('../assets/temp_images/post_image1.png'),
    username: "GoalMachine7Ali",
    profilePic: require('../assets/temp_images/pp3.png'),
  },
  {
    id: 2,
    forumName: "BestProgramsNearMe",
    content: "Checked out @CoachMalik's training program like @FitGuru45 mentioned—place is amazing! Super focused coaches, and the Sunday group sessions are incredible. Way better than your average gym stuff. @BallIsLife82 you were right about the basketball drills, felt like real skill work, not just cardio.",
    imageUrl: require('../assets/temp_images/post_image1.png'),
    username: "LoisInMotion",
    profilePic: require('../assets/temp_images/pp2.png'),
  },
  {
    id: 3,
    forumName: "MenteesPostingWs",
    content: "@NextGenBaller you were right, having a real coach feels like a cheat code. Been training with @CoachMalik for a month now, and I see huge improvements. Footwork is better, stamina is up, and now I actually think before making a move. Game's slowing down for me.",
    username: "CarolWhite",
    profilePic: require('../assets/temp_images/pp3.png'),
  },
  {
    id: 4,
    forumName: "WeeklyMatchups",
    content: "Downtown League playoffs starting next week! @HoopsCentral posted the bracket - who's coming to watch? My money's on @EastSideDragons, they've been unstoppable this season. @CourtKing23 what's your prediction?",
    imageUrl: require('../assets/temp_images/post_image1.png'),
    username: "DavidBrown",
    profilePic: require('../assets/temp_images/pp1.png'),
  },
  {
    id: 5,
    forumName: "TrainingTips",
    content: "New agility drill routine just dropped! Been testing this with my junior team and seeing crazy improvement in their court movement. @CoachTips and @DrillMaster99 - this builds on those footwork patterns you shared last month. Will post full breakdown tomorrow.",
    username: "EveWilson",
    profilePic: require('../assets/temp_images/pp2.png'),
  }
];

const Home = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { threads, loadThreads } = useThreads();
  const { colors } = useTheme();

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadThreads();
    setRefreshing(false);
  }, [loadThreads]);

  // Display user-created threads first, followed by sample threads if needed
  const displayThreads = threads.length > 0 ? threads : sampleThreads;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[colors.mentionText]}
          tintColor={colors.mentionText}
        />
      }
    >
      <View style={styles.content}>
        {displayThreads.map((thread) => (
          <Thread
            key={thread.id}
            forumName={thread.forumName}
            content={thread.content}
            imageUrl={thread.imageUrl}
            profilePic={thread.profilePic}
            username={thread.username}
          />
        ))}
      </View>
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
});

export default Home;
