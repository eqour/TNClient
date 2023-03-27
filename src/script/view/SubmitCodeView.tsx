import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';
import Message from '../constant/Message';
import showToast from '../util/ToastHelper';

enum RequestCodeStatus {
  OK,
  SEND_ERROR,
  ERROR,
}

enum SubmitCodeStatus {
  OK,
  BAD_CODE,
  ERROR,
}

type ExitCallback = () => void;
type RequestCodeCallback = (recipient: string) => Promise<RequestCodeStatus>;
type SubmitCodeCallback = (
  recipient: string,
  code: string,
) => Promise<SubmitCodeStatus>;
type SuccessCallback = (recipient: string) => void;

interface SubmitCodeViewProps {
  recipientPlaceholder: string;
  codePlaceholder: string;
  exitCallback: ExitCallback;
  requestCodeCallback: RequestCodeCallback;
  submitCodeCallback: SubmitCodeCallback;
  successCallback: SuccessCallback;
}

function SubmitCodeView({
  recipientPlaceholder,
  codePlaceholder,
  exitCallback,
  requestCodeCallback,
  submitCodeCallback,
  successCallback,
}: SubmitCodeViewProps): JSX.Element {
  enum Stage {
    INPUT_RECIPIENT,
    REQUEST_CODE,
    INPUT_CODE,
    REQUEST_SUBMIT,
  }
  const [state, setState] = useState({
    stage: Stage.INPUT_RECIPIENT,
    recipient: '',
    code: '',
  });

  const setStage = (stage: Stage) => {
    setState({...state, stage: stage});
  };

  const isDisabled = (): boolean => {
    return (
      state.stage === Stage.REQUEST_CODE || state.stage === Stage.REQUEST_SUBMIT
    );
  };

  const isInputRecipient = (): boolean => {
    return (
      state.stage === Stage.INPUT_RECIPIENT ||
      state.stage === Stage.REQUEST_CODE
    );
  };

  const getTextInputValue = (): string => {
    return isInputRecipient() ? state.recipient : state.code;
  };

  const getTextInputPlaceholder = (): string => {
    return isInputRecipient() ? recipientPlaceholder : codePlaceholder;
  };

  const getTextInputMaxLength = (): number => {
    return isInputRecipient() ? 32 : 4;
  };

  const getTextInputKeyboardType = (): KeyboardTypeOptions => {
    return isInputRecipient() ? 'default' : 'numeric';
  };

  const handleInput = (value: string) => {
    if (isInputRecipient()) {
      setState({...state, recipient: validateRecipient(value)});
    } else {
      setState({...state, code: validateCode(value)});
    }
  };

  const validateRecipient = (value: string): string => {
    return value;
  };

  const validateCode = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  };

  const handleNextClick = async () => {
    if (isInputRecipient()) {
      setStage(Stage.REQUEST_CODE);
      handleRequestCodeStatus(await requestCodeCallback(state.recipient));
    } else {
      setStage(Stage.REQUEST_SUBMIT);
      handleSubmitCodeStatus(
        await submitCodeCallback(state.recipient, state.code),
      );
    }
  };

  const handleRequestCodeStatus = (status: RequestCodeStatus) => {
    switch (status) {
      case RequestCodeStatus.OK:
        setStage(Stage.INPUT_CODE);
        break;
      case RequestCodeStatus.SEND_ERROR:
        setStage(Stage.INPUT_RECIPIENT);
        showToast(Message.CODE_SEND_ERROR);
        break;
      case RequestCodeStatus.ERROR:
      default:
        setStage(Stage.INPUT_RECIPIENT);
        showToast(Message.TEXT_ERROR);
        break;
    }
  };

  const handleSubmitCodeStatus = (status: SubmitCodeStatus) => {
    switch (status) {
      case SubmitCodeStatus.OK:
        successCallback(state.recipient);
        break;
      case SubmitCodeStatus.BAD_CODE:
        setStage(Stage.INPUT_CODE);
        showToast(Message.INCORRECT_CODE_ERROR);
        break;
      case SubmitCodeStatus.ERROR:
      default:
        setStage(Stage.INPUT_CODE);
        showToast(Message.TEXT_ERROR);
        break;
    }
  };

  const handleBackClick = () => {
    if (isInputRecipient()) {
      exitCallback();
    } else {
      setStage(Stage.INPUT_RECIPIENT);
    }
  };

  const styles = StyleSheet.create({
    form: {
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
    },
  });

  return (
    <View style={styles.form}>
      <TextInput
        editable={!isDisabled()}
        selectTextOnFocus={!isDisabled()}
        placeholder={getTextInputPlaceholder()}
        style={[
          styles.textField,
          isInputRecipient() ? {} : styles.codeTextField,
        ]}
        value={getTextInputValue()}
        maxLength={getTextInputMaxLength()}
        keyboardType={getTextInputKeyboardType()}
        onChangeText={handleInput}
      />
      <TouchableOpacity
        disabled={isDisabled()}
        style={[styles.button, isDisabled() ? styles.disabledButton : {}]}
        onPress={handleNextClick}>
        <Text>{Message.BUTTON_CONTINUE}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        disabled={isDisabled()}
        style={[styles.button, isDisabled() ? styles.disabledButton : {}]}
        onPress={handleBackClick}>
        <Text>{Message.BUTTON_BACK}</Text>
      </TouchableOpacity>
    </View>
  );
}

export {SubmitCodeView, RequestCodeStatus, SubmitCodeStatus};
