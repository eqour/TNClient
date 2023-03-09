import React, {useEffect} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import storage from '../util/Storage';

function MainView({navigation}: any): JSX.Element {
  useEffect(() => {
    checkAuthentication();
  });

  const checkAuthentication = () => {
    if (storage().authentication == null) {
      console.debug('auth is null');
      navigation.navigate('Login', {callback: checkAuthentication});
    } else {
      console.debug(
        'email: ' +
          storage().authentication.email +
          '; token: ' +
          storage().authentication.token,
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Главный экран</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
});

export default MainView;
