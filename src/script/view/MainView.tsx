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
import CommunicationChannel from '../model/CommunicationChannel';
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
  RequestCodeStatus as RCodeStatus,
  SubmitCodeStatus,
} from './SubmitCodeView';

function MainView(): JSX.Element {
  enum State {
    LOADING,
    LOADED,
    REQUIRE_AUTH,
    NO_NETWORK_CONNECTION,
    EDIT_COMMUNICATION,
  }

  interface CCData {
    id: string;
    name: string;
    recipient: string | null;
    enabled: boolean;
  }

  const [state, setState] = useState(State.LOADING);
  const [email, setEmail] = useState('');
  const [channels, setChannels] = useState<CommunicationChannels | null>(null);
  const [editedChannel, setEditedChannel] = useState<string | null>(null);

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
        setChannels(result.value);
        setState(State.LOADED);
        break;
      case SimpleStatus.FORBIDDEN:
        setState(State.REQUIRE_AUTH);
        break;
      case SimpleStatus.ERROR:
        setState(State.NO_NETWORK_CONNECTION);
        break;
    }
  };

  const updateEditedChannel = (id: string) => {
    setEditedChannel(id);
    setState(State.EDIT_COMMUNICATION);
  };

  const getChannelsArray = (ccs: CommunicationChannels | null): CCData[] => {
    let result = [];
    if (ccs != null) {
      result.push(getChannelData('vk', 'Вконтакте', ccs.vk));
      result.push(getChannelData('telegram', 'Telegram', ccs.telegram));
    }
    return result;
  };

  const getChannelData = (
    id: string,
    name: string,
    cc: CommunicationChannel,
  ): CCData => {
    const recipient = cc == null || cc.recipient == null ? null : cc.recipient;
    const enabled = cc == null || cc.active == null ? false : cc.active;
    return {
      id: id,
      name: name,
      recipient: recipient,
      enabled: enabled,
    };
  };

  const getEditChannelData = (): CCData => {
    const cArray = getChannelsArray(channels);
    for (let i = 0; i < cArray.length; i++) {
      if (cArray[i].id === editedChannel) {
        return cArray[i];
      }
    }
    throw new Error('communication channel data not found');
  };

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
          data={getChannelsArray(channels)}
          extraData={state}
          renderItem={({item}) => (
            <CCItem
              id={item.id}
              name={item.name}
              recipient={item.recipient}
              enabled={item.enabled}
              setActiveCallback={value => console.debug('active: ' + value)}
              addCallback={value => updateEditedChannel(value)}
              editCallback={value => updateEditedChannel(value)}
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
                return RCodeStatus.OK;
              case RequestCodeStatus.BAD_EMAIL:
                return RCodeStatus.SEND_ERROR;
              case RequestCodeStatus.ERROR:
              default:
                return RCodeStatus.ERROR;
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

  const editCCView = (channelData: CCData): JSX.Element => {
    return (
      <SafeAreaView style={styles.centeringContainer}>
        <SubmitCodeView
          recipientPlaceholder={channelData.name}
          codePlaceholder={Message.PLACEHOLDER_EMAIL_CODE}
          exitCallback={() => setState(State.LOADED)}
          requestCodeCallback={async recipient => {
            const status = await restApiClient().requestChannelRecipientCode(
              channelData.id,
              recipient,
            );
            switch (status) {
              case SimpleStatus.OK:
                return RCodeStatus.OK;
              case SimpleStatus.FORBIDDEN:
                setState(State.REQUIRE_AUTH);
                return RCodeStatus.ERROR;
              case SimpleStatus.ERROR:
              default:
                return RCodeStatus.ERROR;
            }
          }}
          submitCodeCallback={async (recipient, code) => {
            const status = await restApiClient().updateChannelRecipient(
              channelData.id,
              recipient,
              code,
            );
            switch (status) {
              case SimpleStatus.OK:
                return SubmitCodeStatus.OK;
              case SimpleStatus.FORBIDDEN:
                return SubmitCodeStatus.BAD_CODE;
              case SimpleStatus.ERROR:
              default:
                return SubmitCodeStatus.ERROR;
            }
          }}
          successCallback={() => setState(State.LOADING)}
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
  } else if (state === State.EDIT_COMMUNICATION) {
    return editCCView(getEditChannelData());
  } else {
    return mainView();
  }
}

export default MainView;
