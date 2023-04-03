import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {BackHandler} from 'react-native';
import Message from '../constant/Message';
import {
  LoginStatus,
  RequestCodeStatus,
  restApiClient,
} from '../util/RestApiClient';
import showToast from '../util/ToastHelper';

function LoginView({setEmail}: any): JSX.Element {
  enum LoginStage {
    EMAIL_INPUT,
    CODE_REQUEST,
    CODE_INPUT,
    LOGIN_REQUEST,
  }
  const [stage, setStage] = useState(LoginStage.EMAIL_INPUT);
  const textData = useRef({
    email: '',
    code: '',
  });
  const [code, setCode] = useState('');

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    return () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    };
  });

  const handleBackButtonClick = () => {
    if (stage === LoginStage.CODE_INPUT) {
      setStage(LoginStage.EMAIL_INPUT);
    } else {
      BackHandler.exitApp();
    }
    return true;
  };

  const emailView = (disablingState: LoginStage) => {
    return (
      <View style={styles.form}>
        <TextInput
          editable={stage !== disablingState}
          selectTextOnFocus={stage !== disablingState}
          placeholder={Message.PLACEHOLDER_EMAIL}
          style={styles.textField}
          onChangeText={value => {
            textData.current.email = value;
          }}
        />
        <TouchableOpacity
          disabled={stage === disablingState}
          style={
            stage === disablingState ? styles.disabledButton : styles.button
          }
          onPress={handleSubmitEmail}>
          <Text>{Message.BUTTON_CONTINUE}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSubmitEmail = async () => {
    setStage(LoginStage.CODE_REQUEST);
    const status = await restApiClient().requestCode(textData.current.email);
    switch (status) {
      case RequestCodeStatus.OK:
        setStage(LoginStage.CODE_INPUT);
        break;
      case RequestCodeStatus.BAD_EMAIL:
        setStage(LoginStage.EMAIL_INPUT);
        showToast(Message.CODE_SEND_ERROR);
        break;
      case RequestCodeStatus.ERROR:
        setStage(LoginStage.EMAIL_INPUT);
        showToast(Message.TEXT_ERROR);
        break;
    }
  };

  const codeView = (disablingState: LoginStage) => {
    return (
      <View style={styles.form}>
        <TextInput
          editable={stage !== disablingState}
          selectTextOnFocus={stage !== disablingState}
          keyboardType="numeric"
          placeholder={Message.PLACEHOLDER_CONFIRMATION_CODE}
          style={styles.codeTextField}
          value={code}
          onChangeText={handleCodeInput}
          maxLength={4}
        />
        <TouchableOpacity
          disabled={stage === disablingState}
          style={
            stage === disablingState ? styles.disabledButton : styles.button
          }
          onPress={handleSubmitCode}>
          <Text>{Message.BUTTON_LOGIN}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSubmitCode = async () => {
    const status = await restApiClient().login(
      textData.current.email,
      textData.current.code,
    );
    switch (status) {
      case LoginStatus.OK:
        setEmail(textData.current.email);
        break;
      case LoginStatus.BAD_CODE:
        setStage(LoginStage.CODE_INPUT);
        showToast(Message.INCORRECT_CODE_ERROR);
        break;
      case LoginStatus.ERROR:
        setStage(LoginStage.CODE_INPUT);
        showToast(Message.TEXT_ERROR);
        break;
    }
  };

  const handleCodeInput = (text: string) => {
    let newText = text.replace(/[^0-9]/g, '');
    setCode(newText);
    textData.current.code = newText;
  };

  const styles = StyleSheet.create({
    form: {
      flex: 1,
      padding: 10,
      gap: 20,
      justifyContent: 'center',
    },
    textField: {
      height: 40,
      padding: 10,
      borderWidth: 1,
    },
    codeTextField: {
      height: 40,
      padding: 10,
      borderWidth: 1,
      textAlign: 'center',
    },
    button: {
      backgroundColor: 'lightskyblue',
      padding: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    disabledButton: {
      backgroundColor: 'lightgray',
      padding: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
  });

  return stage === LoginStage.EMAIL_INPUT || stage === LoginStage.CODE_REQUEST
    ? emailView(LoginStage.CODE_REQUEST)
    : codeView(LoginStage.LOGIN_REQUEST);
}

export default LoginView;
