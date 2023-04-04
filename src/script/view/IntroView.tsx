import React, {useState} from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import Message from '../constant/Message';

interface IntroViewProps {
  info: JSX.Element;
  children: JSX.Element;
}

function IntroView({info, children: content}: IntroViewProps): JSX.Element {
  const [isGoNext, setGoNext] = useState(false);

  const styles = StyleSheet.create({
    container: {
      padding: '5%',
      gap: 30,
      alignItems: 'center',
    },
    button: {
      backgroundColor: 'lightskyblue',
      padding: 10,
      paddingLeft: '20%',
      paddingRight: '20%',
      borderRadius: 10,
      alignItems: 'center',
    },
  });

  if (isGoNext) {
    return content;
  } else {
    return (
      <View style={styles.container}>
        <View>{info}</View>
        <TouchableOpacity style={styles.button} onPress={() => setGoNext(true)}>
          <Text>{Message.BUTTON_UNDERSTAND}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export default IntroView;
