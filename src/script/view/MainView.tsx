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
import {SelectList} from 'react-native-dropdown-select-list';
import Message from '../constant/Message';
import CommunicationChannel from '../model/CommunicationChannel';
import UserAccount from '../model/UserAccount';
import {
  LoginStatus,
  RequestCodeStatus,
  restApiClient,
  SimpleStatus,
} from '../util/RestApiClient';
import showToast from '../util/ToastHelper';
import CCItem from './CCItem';
import {
  SubmitCodeView,
  RequestCodeStatus as RCodeStatus,
  SubmitCodeStatus,
} from './SubmitCodeView';

function MainView(): JSX.Element {
  enum MainViewStage {
    LOADING,
    LOADED,
    REQUIRE_AUTH,
    NO_NETWORK_CONNECTION,
    EDIT_COMMUNICATION,
  }

  interface StateData {
    stage: MainViewStage;
    email: string;
    account: UserAccount | null;
    editedChannel: string | null;
    groups: string[];
  }

  const [state, setState] = useState<StateData>({
    stage: MainViewStage.LOADING,
    email: '',
    account: null,
    editedChannel: null,
    groups: [],
  });

  const setStage = (stage: MainViewStage) => {
    setState({...state, stage: stage});
  };

  const updateEmail = (newEmail: string) => {
    setState({...state, email: newEmail, stage: MainViewStage.LOADING});
  };

  useEffect(() => {
    if (state.stage === MainViewStage.LOADING) {
      updateAccountData();
    }
  });

  const updateAccountData = async () => {
    const userResult = await restApiClient().getUserAccount();
    const groupsResult = await restApiClient().getSubscriptionGroups();
    const results = [userResult, groupsResult];
    if (results.every(value => value.status === SimpleStatus.OK)) {
      setState({
        ...state,
        account: userResult.value,
        groups: groupsResult.value,
        stage: MainViewStage.LOADED,
      });
    } else if (results.some(value => value.status === SimpleStatus.FORBIDDEN)) {
      setStage(MainViewStage.REQUIRE_AUTH);
    } else {
      setStage(MainViewStage.NO_NETWORK_CONNECTION);
    }
  };

  const updateEditedChannel = (id: string) => {
    setState({
      ...state,
      editedChannel: id,
      stage: MainViewStage.EDIT_COMMUNICATION,
    });
  };

  interface CCData {
    id: string;
    name: string;
    recipient: string | null;
    enabled: boolean;
  }

  const getChannelsArray = (): CCData[] => {
    const ccs = state.account?.channels;
    const result = [];
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
    const cArray = getChannelsArray();
    for (let i = 0; i < cArray.length; i++) {
      if (cArray[i].id === state.editedChannel) {
        return cArray[i];
      }
    }
    throw new Error('communication channel data not found');
  };

  const getGroups = (): {key: string; value: string}[] => {
    const groups = state.groups.map(extractGroupItem);
    groups.unshift(createDefaultGroupItem());
    return groups;
  };

  const extractGroupItem = (
    group: string,
    index: number,
  ): {key: string; value: string} => {
    return {
      key: (index + 1).toString(),
      value: group,
    };
  };

  const createDefaultGroupItem = (): {key: string; value: string} => {
    return {key: '0', value: Message.NO_SUBSCRIPTION};
  };

  const getSelectedGroup = (): {key: string; value: string} => {
    if (state.account != null) {
      const selectedGroup = state.account?.subscriptions.group.name;
      const foundGroup = getGroups().find(
        group => group.value === selectedGroup,
      );
      if (foundGroup != null) {
        return foundGroup;
      }
    }
    return createDefaultGroupItem();
  };

  const handleSelectedGroupChanged = async (key: string) => {
    const fv = getGroups().find(v => v.key === key);
    const value = fv == null ? null : fv.value;
    const name = value === createDefaultGroupItem().value ? null : value;
    if (
      state.account != null &&
      state.account.subscriptions.group.name === name
    ) {
      return;
    }
    const status = await restApiClient().subscribeToNotifications(
      'group',
      name,
    );
    switch (status) {
      case SimpleStatus.OK:
        setStage(MainViewStage.LOADING);
        break;
      case SimpleStatus.FORBIDDEN:
        setStage(MainViewStage.REQUIRE_AUTH);
        break;
      case SimpleStatus.ERROR:
      default:
        showToast(Message.TEXT_ERROR);
    }
  };

  const mainView = (): JSX.Element => {
    return (
      <SafeAreaView>
        <Text>Главный экран</Text>
        <Text>Логин: {state.email}</Text>
        <Text>Токен: {restApiClient().hasToken() ? 'есть' : 'нет'}</Text>
        <Text>Аккаунт: {JSON.stringify(state.account)}</Text>
        <TouchableOpacity onPress={() => setStage(MainViewStage.LOADING)}>
          <Text>Обновить</Text>
        </TouchableOpacity>
        <Text style={styles.sectionText}>
          Подписка на изменения в расписании
        </Text>
        <View style={styles.paddingContainer}>
          <SelectList
            save="key"
            data={getGroups()}
            setSelected={handleSelectedGroupChanged}
            boxStyles={styles.dropdownBox}
            dropdownStyles={styles.dropdownBox}
            defaultOption={getSelectedGroup()}
          />
        </View>
        <Text style={styles.sectionText}>Способы отправки оповещений</Text>
        <FlatList
          data={getChannelsArray()}
          extraData={state}
          renderItem={({item}) => (
            <CCItem
              id={item.id}
              name={item.name}
              recipient={item.recipient}
              enabled={item.enabled}
              setActiveCallback={async (id, active) => {
                const status = await restApiClient().updateChannelActive(
                  id,
                  active,
                );
                switch (status) {
                  case SimpleStatus.OK:
                    setStage(MainViewStage.LOADING);
                    break;
                  case SimpleStatus.FORBIDDEN:
                    setStage(MainViewStage.REQUIRE_AUTH);
                    break;
                  case SimpleStatus.ERROR:
                  default:
                    showToast(Message.TEXT_ERROR);
                }
              }}
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
          exitCallback={() => setStage(MainViewStage.LOADED)}
          requestCodeCallback={async recipient => {
            const status = await restApiClient().requestChannelRecipientCode(
              channelData.id,
              recipient,
            );
            switch (status) {
              case SimpleStatus.OK:
                return RCodeStatus.OK;
              case SimpleStatus.FORBIDDEN:
                setStage(MainViewStage.REQUIRE_AUTH);
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
          successCallback={() => setStage(MainViewStage.LOADING)}
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
          onPress={() => setStage(MainViewStage.LOADING)}>
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
    paddingContainer: {
      paddingLeft: '5%',
      paddingRight: '5%',
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
    sectionText: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 16,
    },
    dropdownBox: {
      borderRadius: 0,
    },
  });

  if (state.stage === MainViewStage.LOADING) {
    return loadView();
  } else if (state.stage === MainViewStage.REQUIRE_AUTH) {
    return loginView();
  } else if (state.stage === MainViewStage.NO_NETWORK_CONNECTION) {
    return noNetworkView();
  } else if (state.stage === MainViewStage.EDIT_COMMUNICATION) {
    return editCCView(getEditChannelData());
  } else {
    return mainView();
  }
}

export default MainView;
