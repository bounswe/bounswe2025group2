// src/navigation/AppNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


// Import pages
import Home from '../Pages/Home';
import AddNew from '../Pages/Add New';         // ✅ filename düzeltilmiş
import Chats from '../Pages/Chats';
import Settings from '../Pages/Settings';
import Login from '../Pages/Login';
import Register from '../Pages/Register';
import Layout from '../components/Layout';
import BottomBar from '../components/BottomBar';
import Goals from '../Pages/Goals';
import Profile from '../Pages/Profile';
import { useAuth } from '../context/AuthContext';

import Notifications from '../Pages/Notifications';
import NotificationPreferences from '../Pages/NotificationPreferences';
import Forum from '../Pages/Forum';

import ChatDetail from '../Pages/ChatDetail';

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
      <Tab.Screen name="AddNew" component={withLayout(AddNew)} />
      <Tab.Screen name="Chats" component={withLayout(Chats)} />
      <Tab.Screen name="Settings" component={withLayout(Settings)} />
      <Tab.Screen name="Goals" component={withLayout(Goals)} />
  <Tab.Screen name="Notifications" component={withLayout(Notifications)} />
  <Tab.Screen name="Forum" component={withLayout(Forum)} />
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
        name="NotificationPreferences" 
        component={NotificationPreferences}
        options={{ title: 'Notification Preferences' }}
      />
      <Stack.Screen 
        name="ChatDetail" 
        component={ChatDetail}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;

