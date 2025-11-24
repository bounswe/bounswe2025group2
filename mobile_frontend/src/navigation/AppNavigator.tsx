// src/navigation/AppNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import pages
import Home from '../Pages/Home';
// import AddNew from '../Pages/Add New';  // Removed Add New page
import Chats from '../Pages/Chats';
import Settings from '../Pages/Settings';
import Login from '../Pages/Login';
import Register from '../Pages/Register';
import Layout from '../components/Layout';
import BottomBar from '../components/BottomBar';
import Goals from '../Pages/Goals';
import Profile from '../Pages/Profile';
import { useAuth } from '../context/AuthContext';
import Challenges from '../Pages/Challenges';
import Notifications from '../Pages/Notifications';
import NotificationPreferences from '../Pages/NotificationPreferences';
import ChatDetail from '../Pages/ChatDetail';
import Forum from '../Pages/Forum.tsx';
import ForumDetail from '../Pages/ForumDetail.tsx';
import ThreadDetail from '../Pages/ThreadDetail.tsx';
import AiChatDetail from '../Pages/AiChatDetail';
import Exercises from '../Pages/Exercises';
import ExerciseDetail from '../Pages/ExerciseDetail';
import Search from '../Pages/Search';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const withLayout = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <Layout>
      <Component {...props as any} />
    </Layout>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props: any) => <BottomBar {...props as any} />}
      screenOptions={{
        headerShown: false,
      }}
    >
  <Tab.Screen name="Home" component={withLayout(Home)} />
  <Tab.Screen name="Forum" component={withLayout(Forum)} />
      <Tab.Screen name="Chats" component={withLayout(Chats)} />
      <Tab.Screen name="Settings" component={withLayout(Settings)} />
      <Tab.Screen name="Goals" component={withLayout(Goals)} />
      <Tab.Screen name="Challenges" component={withLayout(Challenges)} />

    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'Main' : 'Login'}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Auth screens */}
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />

      {/* Main app screens */}
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen 
        name="Notifications" 
        component={Notifications}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen 
        name="NotificationPreferences" 
        component={NotificationPreferences}
        options={{ title: 'Notification Preferences' }}
      />
      <Stack.Screen 
        name="ChatDetail" 
        component={ChatDetail}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen
        name="AiChatDetail"
        component={AiChatDetail}
        options={{ title: 'AI Chat' }}
      />
      <Stack.Screen
        name="ForumDetail"
        component={ForumDetail}
        options={{ title: 'Threads' }}
      />
      <Stack.Screen
        name="ThreadDetail"
        component={ThreadDetail}
        options={{ title: 'Thread' }}
      />
      <Stack.Screen
        name="Exercises"
        component={Exercises}
        options={{ title: 'Exercises', headerShown: true }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetail}
        options={{ title: 'Exercise Details', headerShown: true }}
      />
      <Stack.Screen
        name="Search"
        component={Search}
        options={{ title: 'Search Users', headerShown: true }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;

