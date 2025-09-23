// src/navigation/AppNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import pages
import Home from '../Pages/Home';
import Communities from '../Pages/Communities';
import AddNew from '../Pages/Add New';         // ✅ filename düzeltilmiş
import Mentors from '../Pages/Mentors';
import Chats from '../Pages/Chats';
import Settings from '../Pages/Settings';
import Login from '../Pages/Login';
import Register from '../Pages/Register';
import Layout from '../components/Layout';
import BottomBar from '../components/BottomBar';
import Goals from '../Pages/Goals';
import Profile from '../Pages/Profile';
import ApiDemoScreen from '../Pages/ApiDemoScreen';
import { useAuth } from '../context/AuthContext';
import Notifications from '../Pages/Notifications';
import EditProfile from '../Pages/EditProfile';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const withLayout = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <Layout>
      <Component {...props} />
    </Layout>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => <BottomBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={withLayout(Home)} />
      <Tab.Screen name="Communities" component={withLayout(Communities)} />
      <Tab.Screen name="AddNew" component={withLayout(AddNew)} />
      <Tab.Screen name="Mentors" component={withLayout(Mentors)} />
      <Tab.Screen name="Chats" component={withLayout(Chats)} />
      <Tab.Screen name="Settings" component={withLayout(Settings)} />
      <Tab.Screen name="Goals" component={Goals} />
      <Tab.Screen name="Notifications" component={withLayout(Notifications)} />

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
      <Stack.Screen name="ApiDemo" component={ApiDemoScreen} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
    </Stack.Navigator>
  );
};

export default AppNavigator;

