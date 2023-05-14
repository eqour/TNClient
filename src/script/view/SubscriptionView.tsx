import React, {useState} from 'react';
import {Text, TouchableOpacity, FlatList, View, StyleSheet} from 'react-native';
import {SelectList} from 'react-native-dropdown-select-list';
import Message from '../constant/Message';
import CheckBox from '@react-native-community/checkbox';

type UpdateCallback = (
  selectedOption: string | null,
  selectedChannels: string[],
) => void;
type ExitCallback = () => void;

interface SubscriptionViewProps {
  title: string;
  options: string[];
  selectedOption: string | null;
  channels: string[];
  selectedChannels: string[];
  updateCallback: UpdateCallback;
  exitCallback: ExitCallback;
}

function SubscriptionView({
  title,
  options,
  selectedOption,
  channels,
  selectedChannels,
  updateCallback,
  exitCallback,
}: SubscriptionViewProps): JSX.Element {
  const [state, setState] = useState({
    selectedOption: selectedOption,
    selectedChannels: selectedChannels,
  });

  const getOptionItems = (): {key: string; value: string}[] => {
    const groups = options.map(extractOptionItem);
    groups.unshift(createDefaultOptionItem());
    return groups;
  };

  const extractOptionItem = (
    group: string,
    index: number,
  ): {key: string; value: string} => {
    return {
      key: (index + 1).toString(),
      value: group,
    };
  };

  const createDefaultOptionItem = (): {key: string; value: string} => {
    return {key: '0', value: Message.NO_SUBSCRIPTION};
  };

  const getSelectedOption = (): {key: string; value: string} => {
    const selectedGroup = selectedOption;
    const foundGroup = getOptionItems().find(
      group => group.value === selectedGroup,
    );
    if (foundGroup != null) {
      return foundGroup;
    }
    return createDefaultOptionItem();
  };

  const handleSelectedOptionChanged = async (key: string) => {
    const selectedItem = getOptionItems().find(v => v.key === key);
    const selectedValue = selectedItem == null ? null : selectedItem.value;
    const name =
      selectedValue === createDefaultOptionItem().value ? null : selectedValue;
    if (state.selectedOption !== name) {
      setState({...state, selectedOption: name});
    }
  };

  interface ChannelItem {
    id: string;
    name: string;
    enabled: boolean;
  }

  const getChannelItems = (): ChannelItem[] => {
    return channels.map(value => {
      const i = state.selectedChannels.indexOf(value);
      return {id: value, name: getNameById(value), enabled: i !== -1};
    });
  };

  const getNameById = (id: string): string => {
    switch (id) {
      case 'vk':
        return Message.TEXT_CC_VK;
      case 'telegram':
        return Message.TEXT_CC_TELEGRAM;
      case 'email':
        return Message.TEXT_CC_EMAIL;
      default:
        return '';
    }
  };

  const updateChannelSelection = (channelType: string, enabled: boolean) => {
    const channelTypes = ['vk', 'telegram', 'email'];
    const selected: string[] = [];
    channelTypes.forEach(type => {
      if (type === channelType) {
        if (enabled) {
          selected.push(type);
        }
      } else if (state.selectedChannels.indexOf(type) !== -1) {
        selected.push(type);
      }
    });
    setState({...state, selectedChannels: selected});
  };

  const separator = () => <View style={styles.separator} />;

  const submitButtonPressHandler = () => {
    updateCallback(state.selectedOption, state.selectedChannels);
  };

  const exitButtonPressHandler = () => {
    exitCallback();
  };

  const styles = StyleSheet.create({
    container: {
      padding: '5%',
    },
    sectionText: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 16,
      flexWrap: 'wrap',
    },
    subSectionText: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      flexWrap: 'wrap',
    },
    separator: {
      height: 8,
    },
    button: {
      backgroundColor: 'lightskyblue',
      padding: 10,
      paddingLeft: 24,
      paddingRight: 24,
      borderRadius: 10,
      alignItems: 'center',
    },
    bottomButtonContainer: {
      marginTop: 16,
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 16,
    },
    checkItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.subSectionText}>{Message.TITLE_SUBSCRIPTION}</Text>
      <Text style={styles.sectionText}>{title}</Text>
      <SelectList
        save="key"
        data={getOptionItems()}
        setSelected={handleSelectedOptionChanged}
        defaultOption={getSelectedOption()}
        searchPlaceholder={Message.PLACEHOLDER_SEARCH}
      />
      <Text style={styles.sectionText}>
        {Message.TITLE_COMMUNICATION_CHANNELS}
      </Text>
      <FlatList
        data={getChannelItems()}
        extraData={state}
        renderItem={({item}) => (
          <View style={styles.checkItem}>
            <CheckBox
              tintColors={{true: 'lightskyblue'}}
              value={item.enabled}
              onValueChange={value => updateChannelSelection(item.id, value)}
            />
            <Text>{item.name}</Text>
            <Text>{item.enabled}</Text>
          </View>
        )}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={separator}
      />
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={exitButtonPressHandler}>
          <Text>{Message.BUTTON_BACK}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={submitButtonPressHandler}>
          <Text>{Message.BUTTON_APPLY}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default SubscriptionView;
