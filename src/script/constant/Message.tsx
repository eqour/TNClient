enum Message {
  SERVER_ERROR = 'Произошла ошибка, повторите попытку позже',
  EMAIL_CODE_SEND_ERROR = 'Не удалось отправить код на данный адрес. Укажите другой адрес или повторите попытку позже.',
  INCORRECT_EMAIL_CODE_ERROR = 'Некорректный код',
  PLACEHOLDER_EMAIL_CODE = 'Код',
  PLACEHOLDER_EMAIL = 'Электронная почта',
  BUTTON_CONTINUE = 'Продолжить',
  BUTTON_LOGIN = 'Войти',
}

export default Message;
