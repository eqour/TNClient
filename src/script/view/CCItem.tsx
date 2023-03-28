import React, {useState} from 'react';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {SvgXml} from 'react-native-svg';

type SetActiveCallback = (id: string, value: boolean) => void;
type AddCallback = (id: string) => void;
type EditCallback = (id: string) => void;

interface CCItemProps {
  id: string;
  name: string;
  recipient: string | null;
  enabled: boolean;
  setActiveCallback: SetActiveCallback;
  addCallback: AddCallback;
  editCallback: EditCallback;
}

function CCItem({
  id,
  name,
  recipient,
  enabled,
  setActiveCallback,
  addCallback,
  editCallback,
}: CCItemProps): JSX.Element {
  const [state, setState] = useState({
    name: name,
    recipient: recipient,
    enabled: enabled,
  });

  const switchEnabled = () => {
    const newState = {...state};
    newState.enabled = !newState.enabled;
    setState(newState);
    if (setActiveCallback != null) {
      setActiveCallback(id, newState.enabled);
    }
  };

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
      width: 100,
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

  const bellIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-bell" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
    </svg>
  `;

  const bellOffIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-bell-off" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <line x1="3" y1="3" x2="21" y2="21" />
      <path d="M17 17h-13a4 4 0 0 0 2 -3v-3a7 7 0 0 1 1.279 -3.716m2.072 -1.934c.209 -.127 .425 -.244 .649 -.35a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3" />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
    </svg>
  `;

  return (
    <View style={styles.item}>
      <View style={[styles.panel, styles.panelLeft]}>
        <Text style={styles.channelName}>{state.name}</Text>
        <Text>{isEmpty() ? '' : state.recipient}</Text>
      </View>
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
        <TouchableOpacity
          onPress={switchEnabled}
          disabled={isEmpty()}
          style={[
            styles.editButton,
            state.enabled ? {} : styles.buttonDisabled,
          ]}>
          <SvgXml
            style={styles.buttonIcon}
            xml={state.enabled ? bellIcon : bellOffIcon}
            width="70%"
            height="70%"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default CCItem;
