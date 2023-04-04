import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import MainView from './script/view/MainView';

function WebApp(): JSX.Element {
  const styles = StyleSheet.create({
    main: {
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.main}>
      <MainView />
    </SafeAreaView>
  );
}

export default WebApp;
