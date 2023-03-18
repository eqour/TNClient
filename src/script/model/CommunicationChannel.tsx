class CommunicationChannel {
  recipient: string;
  active: boolean;

  constructor(recipient: string, active: boolean) {
    this.recipient = recipient;
    this.active = active;
  }
}

export default CommunicationChannel;
