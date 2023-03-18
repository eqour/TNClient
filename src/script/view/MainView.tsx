import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Message from '../constant/Message';
import CommunicationChannels from '../model/CommunicationChannels';
import {restApiClient, SimpleStatus} from '../util/RestApiClient';
import showToast from '../util/ToastHelper';
import LoginView from './LoginView';

function MainView(): JSX.Element {
  enum State {
    LOADING,
    LOADED,
    REQUIRE_AUTH,
  }

  const [state, setState] = useState(State.LOADING);
  const [email, setEmail] = useState('');
  const [channels, setChannels] = useState<CommunicationChannels | null>(null);

  const updateEmail = (newEmail: string) => {
    setEmail(newEmail);
    setState(State.LOADING);
  };

  useEffect(() => {
    if (state === State.LOADING) {
      updateMessage();
    }
  });

  const updateMessage = async () => {
    const result = await restApiClient().findAllChannels();
    switch (result.status) {
      case SimpleStatus.OK:
        setState(State.LOADED);
        setChannels(result.value);
        break;
      case SimpleStatus.FORBIDDEN:
        setState(State.REQUIRE_AUTH);
        break;
      case SimpleStatus.ERROR:
        setState(State.LOADED);
        showToast(Message.SERVER_ERROR);
        break;
    }
  };

  const mainView = () => {
    return (
      <View>
        <Text>Главный экран</Text>
        <Text>Логин: {email}</Text>
        <Text>Токен: {restApiClient().hasToken() ? 'есть' : 'нет'}</Text>
        <Text>Способы уведомлений: {JSON.stringify(channels)}</Text>
        <TouchableOpacity onPress={() => setState(State.LOADING)}>
          <Text>Обновить</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const loginView = () => {
    return <LoginView setEmail={updateEmail} />;
  };

  return state === State.REQUIRE_AUTH ? loginView() : mainView();
}

export default MainView;
