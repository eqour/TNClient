import CommunicationChannel from './CommunicationChannel';
import NotificationSubscription from './NotificationSubscription';

interface NotificationSubscriptions {
  [id: string]: NotificationSubscription;
}

interface CommunicationChannels {
  [id: string]: CommunicationChannel;
}

class UserAccount {
  email: string;
  subscriptions: NotificationSubscriptions;
  channels: CommunicationChannels;

  constructor(
    email: string,
    subscriptions: NotificationSubscriptions,
    channels: CommunicationChannels,
  ) {
    this.email = email;
    this.subscriptions = subscriptions;
    this.channels = channels;
  }
}

export default UserAccount;
