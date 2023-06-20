import AsyncStorage from '@react-native-async-storage/async-storage';
import UserAccount from '../model/UserAccount';

function isBadAuthStatus(status: number): boolean {
  return status === 401 || status === 403;
}

enum RequestMethod {
  POST = 'POST',
  GET = 'GET',
  PUT = 'PUT',
}

enum RequestCodeStatus {
  OK,
  BAD_EMAIL,
  ERROR,
}

async function requestCode(email: string): Promise<RequestCodeStatus> {
  try {
    const response = await makeRequest('auth/code', {email: email});
    switch (response.status) {
      case 200:
        return RequestCodeStatus.OK;
      case 422:
        return RequestCodeStatus.BAD_EMAIL;
      default:
        return RequestCodeStatus.ERROR;
    }
  } catch (ignored) {
    return RequestCodeStatus.ERROR;
  }
}

class LoginResult {
  token: string | null;
  status: LoginStatus;

  constructor(token: string | null, status: LoginStatus) {
    this.token = token;
    this.status = status;
  }
}

enum LoginStatus {
  OK,
  BAD_CODE,
  ERROR,
}

async function login(email: string, code: string): Promise<LoginResult> {
  try {
    const response = await makeRequest('auth/login', {
      email: email,
      code: code,
    });
    if (response.status === 200) {
      const result = await response.json();
      return new LoginResult(result.token, LoginStatus.OK);
    } else if (response.status === 401) {
      return new LoginResult(null, LoginStatus.BAD_CODE);
    } else {
      return new LoginResult(null, LoginStatus.ERROR);
    }
  } catch (ignored) {
    return new LoginResult(null, LoginStatus.ERROR);
  }
}

enum SimpleStatus {
  OK,
  ERROR,
  FORBIDDEN,
}

class SimpleResponse<T, S> {
  value: T;
  status: S;

  constructor(value: T, status: S) {
    this.value = value;
    this.status = status;
  }
}

async function getUserAccount(
  token: string,
): Promise<SimpleResponse<UserAccount | null, SimpleStatus>> {
  try {
    const response = await makeRequest(
      'account',
      null,
      RequestMethod.GET,
      token,
    );
    if (response.status === 200) {
      const result = await response.json();
      return new SimpleResponse(result as UserAccount, SimpleStatus.OK);
    } else if (isBadAuthStatus(response.status)) {
      return new SimpleResponse(null, SimpleStatus.FORBIDDEN);
    } else {
      return new SimpleResponse(null, SimpleStatus.ERROR);
    }
  } catch (ignored) {
    return new SimpleResponse(null, SimpleStatus.ERROR);
  }
}

async function requestChannelRecipientCode(
  channelId: string,
  recipient: string,
  token: string,
): Promise<SimpleStatus> {
  try {
    const response = await makeRequest(
      'communication-channels/' + channelId + '/code',
      {recipient: recipient},
      RequestMethod.POST,
      token,
    );
    if (response.status === 200) {
      return SimpleStatus.OK;
    } else if (isBadAuthStatus(response.status)) {
      return SimpleStatus.FORBIDDEN;
    } else {
      return SimpleStatus.ERROR;
    }
  } catch (ignored) {
    return SimpleStatus.ERROR;
  }
}

async function updateChannelRecipient(
  channelId: string,
  recipient: string,
  code: string,
  token: string,
): Promise<SimpleStatus> {
  try {
    const response = await makeRequest(
      'communication-channels/' + channelId + '/id',
      {recipient: recipient, code: code},
      RequestMethod.PUT,
      token,
    );
    if (response.status === 200) {
      return SimpleStatus.OK;
    } else if (isBadAuthStatus(response.status)) {
      return SimpleStatus.FORBIDDEN;
    } else {
      return SimpleStatus.ERROR;
    }
  } catch (ignored) {
    return SimpleStatus.ERROR;
  }
}

async function updateSubscriptionChannels(
  subscriptionType: string,
  channels: string[],
  token: string,
): Promise<SimpleStatus> {
  try {
    const response = await makeRequest(
      'subscriptions/' + subscriptionType + '/channels',
      {channels: channels},
      RequestMethod.PUT,
      token,
    );
    if (response.status === 200) {
      return SimpleStatus.OK;
    } else if (isBadAuthStatus(response.status)) {
      return SimpleStatus.FORBIDDEN;
    } else {
      return SimpleStatus.ERROR;
    }
  } catch (ignored) {
    return SimpleStatus.ERROR;
  }
}

async function getSubscriptions(
  subscriptionType: string,
  token: string,
): Promise<SimpleResponse<string[], SimpleStatus>> {
  try {
    const response = await makeRequest(
      'subscriptions/' + subscriptionType,
      null,
      RequestMethod.GET,
      token,
    );
    if (response.status === 200) {
      const result = await response.json();
      return new SimpleResponse(result as string[], SimpleStatus.OK);
    } else if (isBadAuthStatus(response.status)) {
      return new SimpleResponse([], SimpleStatus.FORBIDDEN);
    } else {
      return new SimpleResponse([], SimpleStatus.ERROR);
    }
  } catch (ignored) {
    return new SimpleResponse([], SimpleStatus.ERROR);
  }
}

async function subscribeToNotification(
  type: string,
  name: string | null,
  token: string,
): Promise<SimpleStatus> {
  try {
    const response = await makeRequest(
      'subscriptions/' + type,
      {name: name},
      RequestMethod.POST,
      token,
    );
    if (response.status === 200) {
      return SimpleStatus.OK;
    } else if (isBadAuthStatus(response.status)) {
      return SimpleStatus.FORBIDDEN;
    } else {
      return SimpleStatus.ERROR;
    }
  } catch (ignored) {
    return SimpleStatus.ERROR;
  }
}

let customHost: string | null = null;

async function makeRequest(
  url: string,
  body: any,
  method: string = RequestMethod.POST,
  token: string = '',
): Promise<Response> {
  console.debug(
    'request: ' + url + ', ' + JSON.stringify(body) + ', token: ' + token,
  );
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000);
  const response = await fetch('http://' + getHost() + '/api/v1/' + url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: body == null ? null : JSON.stringify(body),
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}

function getHost(): string {
  return customHost == null ? '' : customHost;
}

let client: RestApiClient | null = null;

function restApiClient(): RestApiClient {
  if (client === null) {
    client = new RestApiClient();
  }
  return client;
}

class RestApiClient {
  setHost(newHost: string) {
    customHost = newHost;
  }

  hasHost(): boolean {
    return customHost != null;
  }

  getHostString(): string {
    return customHost == null ? '' : customHost;
  }

  async getToken(): Promise<string> {
    const storageToken = await AsyncStorage.getItem('token');
    return storageToken == null ? '' : storageToken;
  }

  async setToken(token: string) {
    AsyncStorage.setItem('token', token);
  }

  clearToken(): void {
    this.setToken('');
  }

  async hasToken(): Promise<boolean> {
    return (await this.getToken()).length > 0;
  }

  async requestCode(email: string): Promise<RequestCodeStatus> {
    return requestCode(email);
  }

  async login(email: string, code: string): Promise<LoginStatus> {
    const result = await login(email, code);
    if (result.status === LoginStatus.OK && result.token != null) {
      this.setToken(result.token);
    }
    return result.status;
  }

  async getUserAccount(): Promise<
    SimpleResponse<UserAccount | null, SimpleStatus>
  > {
    return getUserAccount(await this.getToken());
  }

  async requestChannelRecipientCode(
    channelId: string,
    recipient: string,
  ): Promise<SimpleStatus> {
    return requestChannelRecipientCode(
      channelId,
      recipient,
      await this.getToken(),
    );
  }

  async updateChannelRecipient(
    channelId: string,
    recipient: string,
    code: string,
  ): Promise<SimpleStatus> {
    return updateChannelRecipient(
      channelId,
      recipient,
      code,
      await this.getToken(),
    );
  }

  async updateSubscriptionChannels(
    subscriptionType: string,
    channels: string[],
  ): Promise<SimpleStatus> {
    return updateSubscriptionChannels(
      subscriptionType,
      channels,
      await this.getToken(),
    );
  }

  async getSubscriptionGroups(): Promise<
    SimpleResponse<string[], SimpleStatus>
  > {
    return getSubscriptions('group', await this.getToken());
  }

  async getSubscriptionTeachers(): Promise<
    SimpleResponse<string[], SimpleStatus>
  > {
    return getSubscriptions('teacher', await this.getToken());
  }

  async subscribeToNotifications(
    type: string,
    name: string | null,
  ): Promise<SimpleStatus> {
    return subscribeToNotification(type, name, await this.getToken());
  }
}

export {SimpleStatus, RequestCodeStatus, LoginStatus, restApiClient};
