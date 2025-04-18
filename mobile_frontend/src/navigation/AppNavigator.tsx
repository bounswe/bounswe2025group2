import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import pages
import Home from '../Pages/Home';
import Communities from '../Pages/Communities';
import AddNew from '../Pages/Add New';
import Mentors from '../Pages/Mentors';
import Chats from '../Pages/Chats';
import Settings from '../Pages/Settings';
import Layout from '../components/Layout';
import BottomBar from '../components/BottomBar';

const Tab = createBottomTabNavigator();

const withLayout = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <Layout>
      <Component {...props} />
    </Layout>
  );
};

const AppNavigator = () => {
  return (
    <View style={{ flex: 1 }}>
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
      </Tab.Navigator>
    </View>
  );
};

export default AppNavigator; 