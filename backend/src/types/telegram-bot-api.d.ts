declare module 'node-telegram-bot-api' {
  export interface TelegramMessage {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel';
      first_name?: string;
      username?: string;
      title?: string;
    };
    date: number;
    text?: string;
  }

  export interface TelegramChat {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    username?: string;
    first_name?: string;
    last_name?: string;
  }

  export default class TelegramBot {
    constructor(token: string, options?: { polling?: boolean });
    sendMessage(chatId: string | number, text: string, options?: any): Promise<any>;
    getMe(): Promise<{ username: string; id: number }>;
    getChat(chatId: string | number): Promise<TelegramChat>;
    on(event: 'message', callback: (msg: TelegramMessage) => void): void;
  }
}

