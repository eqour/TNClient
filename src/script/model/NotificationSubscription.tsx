class NotificationSubscription {
  name: string;
  channels: string[];

  constructor(name: string, channels: string[]) {
    this.name = name;
    this.channels = channels;
  }
}

export default NotificationSubscription;
