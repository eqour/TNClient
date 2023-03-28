class CommunicationChannel {
  type: string;
  recipient: string;
  active: boolean;

  constructor(type: string, recipient: string, active: boolean) {
    this.type = type;
    this.recipient = recipient;
    this.active = active;
  }
}

export default CommunicationChannel;
