import React, {useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import {hello} from '../util/RestApiClient';
import LoginView from './LoginView';

function MainView(): JSX.Element {
  const [auth, setAuth] = useState({
    email: null,
    token: null,
  });
  const [message, setMessage] = useState<string | null>('');

  const hasAuthentication = () => {
    return auth.email != null && auth.token != null;
  };

  useEffect(() => {
    if (hasAuthentication() && message === '') {
      updateMessage();
    }
  });

  const updateMessage = async () => {
    const result = await hello(auth.token == null ? '' : auth.token);
    setMessage(result);
  };

  const mainView = () => {
    return (
      <View>
        <Text>Главный экран</Text>
        <Text>Логин: {auth.email}</Text>
        <Text>Токен: {auth.token}</Text>
        <Text>Сообщение от сервера: {message}</Text>
      </View>
    );
  };

  const loginView = () => {
    return <LoginView setAuth={setAuth} />;
  };

  return hasAuthentication() ? mainView() : loginView();
}

export default MainView;
