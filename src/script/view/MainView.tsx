import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import Message from '../constant/Message';
import CommunicationChannels from '../model/CommunicationChannels';
import {restApiClient, SimpleStatus} from '../util/RestApiClient';
import showToast from '../util/ToastHelper';
import CCItem from './CCItem';
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

  const data = [
    {
      id: '0',
      name: 'Вконтакте',
      recipient: 'vk-id',
      enabled: false,
    },
    {
      id: '1',
      name: 'Telegram',
      recipient: 'telegram-id',
      enabled: true,
    },
  ];

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
        <FlatList
          data={data}
          renderItem={({item}) => (
            <CCItem
              name={item.name}
              recipient={item.recipient}
              enabled={item.enabled}
            />
          )}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => <View style={{height: 8}} />}
        />
      </View>
    );
  };

  const loginView = () => {
    return <LoginView setEmail={updateEmail} />;
  };

  return state === State.REQUIRE_AUTH ? loginView() : mainView();
}

export default MainView;
