/**
 * Шаблоны email-сообщений на русском языке.
 * Подключите SMTP-транспорт (nodemailer/resend) для отправки.
 */

export const emailTemplates = {
  welcome: (username: string) => ({
    subject: "Добро пожаловать в NeoVPN",
    html: `
      <h1>Добро пожаловать, ${username}!</h1>
      <p>Ваш аккаунт NeoVPN успешно создан.</p>
      <p>Для активации подписки войдите в личный кабинет и введите код активации.</p>
      <p>С уважением,<br>Команда NeoVPN</p>
    `,
    text: `Добро пожаловать, ${username}! Ваш аккаунт NeoVPN успешно создан. Для активации подписки войдите в личный кабинет.`,
  }),

  passwordReset: (username: string, newPassword: string) => ({
    subject: "NeoVPN — Ваш пароль был сброшен",
    html: `
      <h1>Сброс пароля</h1>
      <p>Здравствуйте, ${username}.</p>
      <p>Администратор сбросил ваш пароль. Новый временный пароль:</p>
      <p><strong>${newPassword}</strong></p>
      <p>Рекомендуем сменить пароль после входа в систему.</p>
      <p>С уважением,<br>Команда NeoVPN</p>
    `,
    text: `Здравствуйте, ${username}. Ваш новый пароль: ${newPassword}. Рекомендуем сменить его после входа.`,
  }),

  subscriptionActivated: (username: string, expireAt: string) => ({
    subject: "NeoVPN — Подписка активирована",
    html: `
      <h1>Подписка активирована</h1>
      <p>Здравствуйте, ${username}.</p>
      <p>Ваша подписка NeoVPN успешно активирована.</p>
      <p>Дата окончания: <strong>${expireAt}</strong></p>
      <p>Перейдите в личный кабинет для получения ссылки на подписку.</p>
      <p>С уважением,<br>Команда NeoVPN</p>
    `,
    text: `Подписка активирована. Дата окончания: ${expireAt}.`,
  }),

  accountDisabled: (username: string) => ({
    subject: "NeoVPN — Аккаунт отключён",
    html: `
      <h1>Аккаунт отключён</h1>
      <p>Здравствуйте, ${username}.</p>
      <p>Ваш аккаунт NeoVPN был отключён администратором.</p>
      <p>Для получения дополнительной информации обратитесь в поддержку.</p>
      <p>С уважением,<br>Команда NeoVPN</p>
    `,
    text: `Ваш аккаунт NeoVPN был отключён. Обратитесь в поддержку.`,
  }),
};

export async function sendEmail(
  _to: string,
  _template: { subject: string; html: string; text: string }
): Promise<void> {
  // Интеграция SMTP: настройте SMTP_HOST, SMTP_USER, SMTP_PASS в .env
  // и подключите nodemailer или аналогичный транспорт
  if (process.env.SMTP_HOST) {
    // TODO: implement when SMTP is configured
  }
}
