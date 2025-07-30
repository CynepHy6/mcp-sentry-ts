# MCP Sentry сервер

Model Context Protocol (MCP) сервер для работы с Sentry API. Позволяет AI ассистентам получать и анализировать данные об ошибках, управлять проектами и мониторить производительность приложений.

## Требования

- Node.js (v14+)
- npm или yarn
- Аккаунт Sentry с доступом к API
- Токен аутентификации Sentry

## Установка

```bash
npm install
```

## Настройка в Claude

Добавьте конфигурацию в настройки Claude:

```json
{
    "mcpServers": {
        "sentry": {
            "command": "npx",
            "args": ["ts-node", "/path/to/mcp-sentry-ts/src/index.ts"],
            "env": {
                "SENTRY_AUTH": "<YOUR_AUTH_TOKEN>",
                "SENTRY_HOST": "https://sentry.skyeng.tech"
            }
        }
    }
}
```

## Основные инструменты

### list_projects
Список проектов организации.

### get_sentry_issue
Получение детальной информации об issue.
- `issue_id_or_url`: ID issue или полный URL
- `organization_slug`: слаг организации

### get_sentry_event
Получение детальной информации о событии, включая Additional Data.
- `issue_id_or_url`: ID issue или URL
- `event_id`: ID события
- `organization_slug`: слаг организации

### list_issue_events
Список событий для issue.

### extract_issue_context_data
Извлечение данных контекста из всех событий issue.

## Переменные окружения

- `SENTRY_AUTH` (обязательно): токен аутентификации Sentry
- `SENTRY_HOST` (опционально): URL Sentry сервера (по умолчанию https://sentry.io)

## Запуск

```bash
npx ts-node src/index.ts
```