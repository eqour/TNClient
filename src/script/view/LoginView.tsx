import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import storage from '../util/Storage';

function LoginView({navigation, route}: any): JSX.Element {
  const successHandler = () => {
    storage().authentication = {
      email: 'temp',
      token: 'null',
    };
    navigation.goBack();
    route.params.callback();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Введите адрес эллектронной почты</Text>
      <TextInput style={styles.textInpt} placeholder="Электронная почта" />
      <TouchableOpacity onPress={() => successHandler()}>
        <Text>Продолжить</Text>
      </TouchableOpacity>
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
  textInpt: {
    padding: 0,
    height: 30,
  },
});

export default LoginView;
