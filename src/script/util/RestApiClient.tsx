const host: string = 'http://192.168.69.112:8085/api/v1/';

enum RequestCodeResult {
  OK,
  BAD_EMAIL,
  ERROR,
}

async function requestCode(email: string): Promise<RequestCodeResult> {
  try {
    const response = await makeRequest('auth/code', {email: email}, '');
    switch (response.status) {
      case 200:
        return RequestCodeResult.OK;
      case 422:
        return RequestCodeResult.BAD_EMAIL;
      default:
        return RequestCodeResult.ERROR;
    }
  } catch (ignored) {
    return RequestCodeResult.ERROR;
  }
}

class LoginResult {
  token: string | null;
  status: LoginResultStatus;

  constructor(token: string | null, status: LoginResultStatus) {
    this.token = token;
    this.status = status;
  }
}

enum LoginResultStatus {
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
      return new LoginResult(result.token, LoginResultStatus.OK);
    } else if (response.status === 401) {
      return new LoginResult(null, LoginResultStatus.BAD_CODE);
    } else {
      return new LoginResult(null, LoginResultStatus.ERROR);
    }
  } catch (ignored) {
    return new LoginResult(null, LoginResultStatus.ERROR);
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

export {
  requestCode,
  RequestCodeResult,
  login,
  LoginResult,
  LoginResultStatus,
  hello,
};
