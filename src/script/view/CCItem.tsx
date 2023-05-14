import React, {useState} from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {SvgXml} from 'react-native-svg';

type AddCallback = (id: string) => void;
type EditCallback = (id: string) => void;

interface CCItemProps {
  id: string;
  name: string;
  recipient: string | null;
  readonly: boolean;
  addCallback: AddCallback;
  editCallback: EditCallback;
}

function CCItem({
  id,
  name,
  recipient,
  readonly,
  addCallback,
  editCallback,
}: CCItemProps): JSX.Element {
  const [state] = useState({
    name: name,
    recipient: recipient,
  });

  const isEmpty = (): boolean => {
    return state.recipient == null;
  };

  const handleChangeButtonClick = () => {
    if (isEmpty()) {
      addCallback(id);
    } else {
      editCallback(id);
    }
  };

  const styles = StyleSheet.create({
    item: {
      flexDirection: 'row',
      gap: 8,
      paddingLeft: 8,
      paddingRight: 8,
      height: 50,
      backgroundColor: 'whitesmoke',
    },
    panel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    panelLeft: {
      flex: 1,
    },
    channelName: {
      width: 110,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: 4,
      justifyContent: 'center',
      backgroundColor: 'lightskyblue',
    },
    buttonIcon: {
      alignSelf: 'center',
    },
    buttonDisabled: {
      backgroundColor: 'lightgray',
    },
  });

  const plusIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-plus" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  `;

  const editIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-edit" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3" />
      <path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3" />
      <line x1="16" y1="5" x2="19" y2="8" />
    </svg>
  `;

  const controlButtons = () => {
    if (readonly) {
      return <View style={styles.panel} />;
    } else {
      return (
        <View style={styles.panel}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleChangeButtonClick}>
            <SvgXml
              style={styles.buttonIcon}
              xml={isEmpty() ? plusIcon : editIcon}
              width="70%"
              height="70%"
            />
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.item}>
      <View style={[styles.panel, styles.panelLeft]}>
        <Text style={styles.channelName}>{state.name}</Text>
        <Text>{isEmpty() ? '' : state.recipient}</Text>
      </View>
      {controlButtons()}
    </View>
  );
}

export default CCItem;
