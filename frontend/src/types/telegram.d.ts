// Telegram Web App API types
interface TelegramWebApp {
  openTelegramLink(url: string): void;
  openLink(url: string): void;
  ready(): void;
  expand(): void;
  close(): void;
  sendData(data: string): void;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
}

interface Telegram {
  WebApp: TelegramWebApp;
}

interface Window {
  Telegram?: Telegram;
}

