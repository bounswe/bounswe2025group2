import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import pages
import Home from '../Pages/Home';
import Communities from '../Pages/Communities';
import AddNew from '../Pages/Add New';
import Mentors from '../Pages/Mentors';
import Chats from '../Pages/Chats';
import Settings from '../Pages/Settings';
import Login from '../Pages/Login';
import Register from '../Pages/Register';
import Layout from '../components/Layout';
import BottomBar from '../components/BottomBar';
import Goals from '../Pages/Goals';
import Notifications from '../Pages/Notifications';

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
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
};

export default AppNavigator;