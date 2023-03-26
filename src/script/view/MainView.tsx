import React, {useEffect, useState} from 'react';
import {
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  FlatList,
  BackHandler,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Message from '../constant/Message';
import CommunicationChannels from '../model/CommunicationChannels';
import {
  LoginStatus,
  RequestCodeStatus,
  restApiClient,
  SimpleStatus,
} from '../util/RestApiClient';
import CCItem from './CCItem';
import {
  SubmitCodeView,
  RequestCodeStatus as LoginRequestCodeStatus,
  SubmitCodeStatus,
} from './SubmitCodeView';

function MainView(): JSX.Element {
  enum State {
    LOADING,
    LOADED,
    REQUIRE_AUTH,
    NO_NETWORK_CONNECTION,
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
        setState(State.NO_NETWORK_CONNECTION);
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

  const mainView = (): JSX.Element => {
    return (
      <SafeAreaView>
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </SafeAreaView>
    );
  };

  const loginView = (): JSX.Element => {
    return (
      <SafeAreaView style={styles.centeringContainer}>
        <SubmitCodeView
          recipientPlaceholder={Message.PLACEHOLDER_EMAIL}
          codePlaceholder={Message.PLACEHOLDER_EMAIL_CODE}
          exitCallback={() => BackHandler.exitApp()}
          requestCodeCallback={async recipient => {
            const status = await restApiClient().requestCode(recipient);
            switch (status) {
              case RequestCodeStatus.OK:
                return LoginRequestCodeStatus.OK;
              case RequestCodeStatus.BAD_EMAIL:
                return LoginRequestCodeStatus.SEND_ERROR;
              case RequestCodeStatus.ERROR:
              default:
                return LoginRequestCodeStatus.ERROR;
            }
          }}
          submitCodeCallback={async (recipient, code) => {
            const status = await restApiClient().login(recipient, code);
            switch (status) {
              case LoginStatus.OK:
                return SubmitCodeStatus.OK;
              case LoginStatus.BAD_CODE:
                return SubmitCodeStatus.BAD_CODE;
              case LoginStatus.ERROR:
              default:
                return SubmitCodeStatus.ERROR;
            }
          }}
          successCallback={updateEmail}
        />
      </SafeAreaView>
    );
  };

  const loadView = (): JSX.Element => {
    return (
      <SafeAreaView style={styles.centeringContainer}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  };

  const noNetworkView = (): JSX.Element => {
    return (
      <SafeAreaView style={[styles.centeringContainer, styles.networkView]}>
        <Text>{Message.NO_NETWORK_CONNECTION}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setState(State.LOADING)}>
          <Text>{Message.BUTTON_RECONNECT}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  };

  const styles = StyleSheet.create({
    separator: {
      height: 8,
    },
    centeringContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    networkView: {
      gap: 16,
      alignItems: 'center',
    },
    button: {
      backgroundColor: 'lightskyblue',
      padding: 10,
      borderRadius: 10,
      alignItems: 'center',
      width: '50%',
    },
  });

  if (state === State.LOADING) {
    return loadView();
  } else if (state === State.REQUIRE_AUTH) {
    return loginView();
  } else if (state === State.NO_NETWORK_CONNECTION) {
    return noNetworkView();
  } else {
    return mainView();
  }
}

export default MainView;
