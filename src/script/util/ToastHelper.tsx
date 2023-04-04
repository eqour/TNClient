import {Platform} from 'react-native';

function showToast(message: string) {
  if (Platform.OS === 'android') {
    // ToastAndroid.show(message, ToastAndroid.SHORT);
    console.log('android toast: ' + message);
  } else {
    // Alert.alert(message);
    console.log('iod toast: ' + message);
  }
}

export default showToast;
