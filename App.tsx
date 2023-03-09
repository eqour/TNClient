import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginView from './src/script/view/LoginView';
import MainView from './src/script/view/MainView';

const Stack = createNativeStackNavigator();

function App(): JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={MainView}
          options={{title: 'Главный экран'}}
        />
        <Stack.Screen
          name="Login"
          component={LoginView}
          options={{title: 'Вход'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
