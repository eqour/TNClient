import CommunicationChannel from './CommunicationChannel';

class CommunicationChannels {
  vk: CommunicationChannel;
  telegram: CommunicationChannel;

  constructor(vk: CommunicationChannel, telegram: CommunicationChannel) {
    this.vk = vk;
    this.telegram = telegram;
  }
}

export default CommunicationChannels;
