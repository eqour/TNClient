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
  Linking,
  TextInput,
} from 'react-native';
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
import IntroView from './IntroView';
import SubscriptionView from './SubscriptionView';

function MainView(): JSX.Element {
  const DEBUG = false;
  enum MainViewStage {
    LOADING,
    LOADED,
    REQUIRE_AUTH,
    NO_NETWORK_CONNECTION,
    EDIT_COMMUNICATION,
    EDIT_SUBSCRIPTION,
  }

  const [host, setHost] = useState(restApiClient().getHostString());

  interface StateData {
    stage: MainViewStage;
    email: string;
    account: UserAccount | null;
    editedChannel: string | null;
    editedSubscription: string | null;
    groups: string[];
    teachers: string[];
  }

  const [state, setState] = useState<StateData>({
    stage: MainViewStage.LOADING,
    email: '',
    account: null,
    editedChannel: null,
    editedSubscription: null,
    groups: [],
    teachers: [],
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
    if (!restApiClient().hasHost()) {
      setStage(MainViewStage.NO_NETWORK_CONNECTION);
      return;
    }
    const userResult = await restApiClient().getUserAccount();
    const groupsResult = await restApiClient().getSubscriptionGroups();
    const teacherssResult = await restApiClient().getSubscriptionTeachers();
    const results = [userResult, groupsResult, teacherssResult];
    if (results.every(value => value.status === SimpleStatus.OK)) {
      setState({
        ...state,
        account: userResult.value,
        groups: groupsResult.value,
        teachers: teacherssResult.value,
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

  const updateEditedSubscription = (id: string) => {
    setState({
      ...state,
      editedSubscription: id,
      stage: MainViewStage.EDIT_SUBSCRIPTION,
    });
  };

  interface CCData {
    id: string;
    name: string;
    recipient: string | null;
    readonly: boolean;
  }

  const getChannelsArray = (): CCData[] => {
    const ccs = state.account?.channels;
    const result = [];
    if (ccs != null) {
      result.push(getChannelData('vk', Message.TEXT_CC_VK, ccs.vk));
      result.push(
        getChannelData('telegram', Message.TEXT_CC_TELEGRAM, ccs.telegram),
      );
      result.push({
        id: 'email',
        name: Message.TEXT_CC_EMAIL,
        recipient: state.account == null ? '' : state.account.email,
        readonly: true,
      });
    }
    return result;
  };

  const getChannelData = (
    id: string,
    name: string,
    cc: CommunicationChannel,
  ): CCData => {
    const recipient = cc == null || cc.recipient == null ? null : cc.recipient;
    return {
      id: id,
      name: name,
      recipient: recipient,
      readonly: false,
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

  interface SubscriptionData {
    id: string;
    name: string;
    options: string[];
    selectedOption: string | null;
    channels: string[];
    selectedChannels: string[];
  }

  const defaultChannels = (): string[] => {
    return ['vk', 'telegram', 'email'];
  };

  const getSubscriptionData = (): SubscriptionData[] => {
    const account = state.account;
    const result = [];
    result.push({
      id: 'group',
      name: Message.TEXT_SUB_GROUP,
      options: state.groups,
      selectedOption: account == null ? null : account.subscriptions.group.name,
      channels: defaultChannels(),
      selectedChannels:
        account == null ? [] : account.subscriptions.group.channels,
    });
    result.push({
      id: 'teacher',
      name: Message.TEXT_SUB_TEACHER,
      options: state.teachers,
      selectedOption:
        account == null ? null : account.subscriptions.teacher.name,
      channels: defaultChannels(),
      selectedChannels:
        account == null ? [] : account.subscriptions.teacher.channels,
    });
    return result;
  };

  const getEditSubscriptionData = (): SubscriptionData => {
    const sArray = getSubscriptionData();
    for (let i = 0; i < sArray.length; i++) {
      if (sArray[i].id === state.editedSubscription) {
        return sArray[i];
      }
    }
    throw new Error('subscription data not found');
  };

  const getSelectedSubscriptionOption = (
    array: string[],
    name: string | null,
  ): string => {
    return name !== null && array.indexOf(name) !== -1
      ? name
      : Message.NO_SUBSCRIPTION;
  };

  const handleSubscriptionChanged = async (
    type: string,
    name: string | null,
    channels: string[],
  ) => {
    const status = await restApiClient().subscribeToNotifications(type, name);
    handleResponseStatus(status, async () => {
      const stts = await restApiClient().updateSubscriptionChannels(
        type,
        channels,
      );
      handleResponseStatus(stts, () => setStage(MainViewStage.LOADING));
    });
  };

  type SuccessCallback = () => void;

  const handleResponseStatus = (
    status: SimpleStatus,
    callback: SuccessCallback,
  ) => {
    switch (status) {
      case SimpleStatus.OK:
        callback();
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
      <SafeAreaView style={styles.centeringContainer}>
        <View>
          {debugView()}
          <Text style={styles.sectionText}>{Message.TITLE_SUBSCRIPTIONS}</Text>
          <FlatList
            data={getSubscriptionData()}
            extraData={state}
            renderItem={({item}) => (
              <CCItem
                id={item.id}
                name={item.name}
                recipient={getSelectedSubscriptionOption(
                  item.id === 'group' ? state.groups : state.teachers,
                  item.selectedOption,
                )}
                readonly={false}
                addCallback={value => updateEditedSubscription(value)}
                editCallback={value => updateEditedSubscription(value)}
              />
            )}
            keyExtractor={item => item.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          <Text style={styles.sectionText}>
            {Message.TITLE_COMMUNICATION_CHANNELS}
          </Text>
          <FlatList
            data={getChannelsArray()}
            extraData={state}
            renderItem={({item}) => (
              <CCItem
                id={item.id}
                name={item.name}
                recipient={item.recipient}
                readonly={item.readonly}
                addCallback={value => updateEditedChannel(value)}
                editCallback={value => updateEditedChannel(value)}
              />
            )}
            keyExtractor={item => item.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setStage(MainViewStage.LOADING)}>
              <Text>{Message.BUTTON_UPDATE}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                restApiClient().clearToken();
                setStage(MainViewStage.REQUIRE_AUTH);
              }}>
              <Text>{Message.BUTTON_LOGOUT}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  const debugView = (): JSX.Element => {
    if (DEBUG) {
      return (
        <View>
          <Text>Главный экран</Text>
          <Text>Логин: {state.email}</Text>
          <Text>Аккаунт: {JSON.stringify(state.account)}</Text>
          <TouchableOpacity onPress={() => setStage(MainViewStage.LOADING)}>
            <Text>Обновить</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return <View />;
    }
  };

  const loginView = (): JSX.Element => {
    return (
      <SafeAreaView style={styles.centeringContainer}>
        <SubmitCodeView
          title={Message.TITLE_LOGIN}
          submitCodeTitle={Message.TITLE_SUBMIT_CODE}
          recipientPlaceholder={Message.PLACEHOLDER_EMAIL}
          codePlaceholder={Message.PLACEHOLDER_CONFIRMATION_CODE}
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

  const editSubscriptionView = (
    subscriptionData: SubscriptionData,
  ): JSX.Element => {
    return (
      <SafeAreaView style={styles.centeringContainer}>
        <SubscriptionView
          title={subscriptionData.name}
          options={subscriptionData.options}
          selectedOption={subscriptionData.selectedOption}
          channels={subscriptionData.channels}
          selectedChannels={subscriptionData.selectedChannels}
          updateCallback={(option, channels) => {
            handleSubscriptionChanged(subscriptionData.id, option, channels);
          }}
          exitCallback={() => {
            setStage(MainViewStage.LOADING);
          }}
        />
      </SafeAreaView>
    );
  };

  const editCCView = (channelData: CCData): JSX.Element => {
    return (
      <SafeAreaView style={styles.centeringContainer}>
        <IntroView info={channelData.id === 'vk' ? vkIntro() : tgIntro()}>
          <SubmitCodeView
            title={
              channelData.recipient === null
                ? Message.TITLE_ADD_CHANNEL
                : Message.TITLE_EDIT_CHANNEL
            }
            submitCodeTitle={Message.TITLE_SUBMIT_CODE}
            recipientPlaceholder={
              channelData.id === 'vk'
                ? Message.PLACEHOLDER_VK_ID
                : Message.PLACEHOLDER_TG_ID
            }
            codePlaceholder={Message.PLACEHOLDER_CONFIRMATION_CODE}
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
        </IntroView>
      </SafeAreaView>
    );
  };

  const vkIntro = (): JSX.Element => (
    <View>
      <Text style={styles.paragraph}>
        Перед подключением оповещений ВКонтакте необходимо начать диалог с{' '}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL('https://vk.com/write-203759542')}>
          ботом сообщества
        </Text>
        .
      </Text>
      <Text>
        Также для настройки потребуется узнать свой VK ID. Его можно найти в
        разделе Сервисы {'>'} Управление VK ID {'>'} Личные данные.
      </Text>
    </View>
  );

  const tgIntro = (): JSX.Element => (
    <View>
      <Text style={styles.paragraph}>
        Перед подключением оповещений Telegram необходимо начать диалог с{' '}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL('https://t.me/ascor_bot')}>
          ботом
        </Text>
        .
      </Text>
      <Text>
        Также для настройки потребуется узнать свой Telegram ID. Его можно
        получить у одного из ботов:{' '}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL('https://t.me/getidsbot')}>
          GetIDs Bot
        </Text>
        .
      </Text>
    </View>
  );

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
        <TextInput
          placeholder={Message.PLACEHOLDER_HOST}
          style={styles.textField}
          onChangeText={value => setHost(value)}
          value={host}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            restApiClient().setHost(host);
            setStage(MainViewStage.LOADING);
          }}>
          <Text>{Message.BUTTON_RECONNECT}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  };

  const styles = StyleSheet.create({
    paragraph: {
      marginBottom: 10,
      flexWrap: 'wrap',
    },
    link: {
      color: '#0969DA',
    },
    separator: {
      height: 8,
    },
    centeringContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    bottomButtonContainer: {
      marginTop: 16,
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 16,
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
      paddingLeft: 24,
      paddingRight: 24,
      borderRadius: 10,
      alignItems: 'center',
    },
    sectionText: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 16,
      flexWrap: 'wrap',
    },
    dropdownBox: {
      borderRadius: 0,
    },
    textField: {
      height: 40,
      padding: 10,
      width: '70%',
      textAlign: 'center',
      borderWidth: 1,
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
  } else if (state.stage === MainViewStage.EDIT_SUBSCRIPTION) {
    return editSubscriptionView(getEditSubscriptionData());
  } else {
    return mainView();
  }
}

export default MainView;
