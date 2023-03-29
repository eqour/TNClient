enum Message {
  TEXT_ERROR = 'Произошла ошибка, повторите попытку позже',
  CODE_SEND_ERROR = 'Не удалось отправить код',
  INCORRECT_CODE_ERROR = 'Некорректный код',
  PLACEHOLDER_EMAIL_CODE = 'Код',
  PLACEHOLDER_EMAIL = 'Электронная почта',
  BUTTON_CONTINUE = 'Продолжить',
  BUTTON_BACK = 'Назад',
  BUTTON_LOGIN = 'Войти',
  NO_NETWORK_CONNECTION = 'Отсутствует подключение к сети',
  BUTTON_RECONNECT = 'Обновить',
  NO_SUBSCRIPTION = 'Нет подписки',
  TITLE_GROUP_SUBSCRIPTION = 'Подписка на изменение расписания в группе',
  TITLE_COMMUNICATION_CHANNELS = 'Способы отправки оповещений',
  TEXT_CC_VK = 'Вконтакте',
  TEXT_CC_TELEGRAM = 'Telegram',
  BUTTON_UPDATE = 'Обновить',
  BUTTON_LOGOUT = 'Выйти',
}

export default Message;
