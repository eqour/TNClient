import CommunicationChannels from '../model/CommunicationChannels';

const host: string = 'http://192.168.69.112:8085/api/v1/';

enum RequestCodeStatus {
  OK,
  BAD_EMAIL,
  ERROR,
}

async function requestCode(email: string): Promise<RequestCodeStatus> {
  try {
    const response = await makeRequest('auth/code', {email: email}, '');
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
    const response = await makeRequest(
      'auth/login',
      {email: email, code: code},
      '',
    );
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

async function hello(token: string): Promise<string> {
  try {
    const response = await makeRequest('hello-world', null, token);
    if (response.status === 200) {
      return await response.json();
    } else {
      return 'not 200';
    }
  } catch (error) {
    return 'error';
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

async function findAllChannels(
  token: string,
): Promise<SimpleResponse<CommunicationChannels | null, SimpleStatus>> {
  try {
    const response = await makeRequest('communication-channels', null, token);
    if (response.status === 200) {
      const result = await response.json();
      return new SimpleResponse(
        result as CommunicationChannels,
        SimpleStatus.OK,
      );
    } else if (response.status === 401 || response.status === 403) {
      return new SimpleResponse(null, SimpleStatus.FORBIDDEN);
    } else {
      return new SimpleResponse(null, SimpleStatus.ERROR);
    }
  } catch (ignored) {
    return new SimpleResponse(null, SimpleStatus.ERROR);
  }
}

async function makeRequest(
  url: string,
  body: any,
  token: string,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000);
  const response = await fetch(host + url, {
    method: 'POST',
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

let client: RestApiClient | null = null;

function restApiClient(): RestApiClient {
  if (client === null) {
    client = new RestApiClient();
  }
  return client;
}

class RestApiClient {
  token: string;

  constructor() {
    this.token = '';
  }

  hasToken(): boolean {
    return this.token.length > 0;
  }

  async requestCode(email: string): Promise<RequestCodeStatus> {
    return requestCode(email);
  }

  async login(email: string, code: string): Promise<LoginStatus> {
    const result = await login(email, code);
    if (result.status === LoginStatus.OK && result.token != null) {
      this.token = result.token;
    }
    return result.status;
  }

  async hello(): Promise<string> {
    return hello(this.token);
  }

  async findAllChannels(): Promise<
    SimpleResponse<CommunicationChannels | null, SimpleStatus>
  > {
    return findAllChannels(this.token);
  }
}

export {SimpleStatus, RequestCodeStatus, LoginStatus, restApiClient};
