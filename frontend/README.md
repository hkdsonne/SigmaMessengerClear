# TCHK Messenger — Frontend

Frontend часть мессенджера ТЧК, реализованная на React (Vite).

Проект представляет собой UI мессенджера с авторизацией, чатами, пользователями и настройками.

---
Чтобы запустить проект в терминале пишем по порядку:

cd frontend

npm install

npm run dev

---
# Запуск проекта

## 1. Установить зависимости

npm install

## 2. Заупстить приложение

npm run dev

После запуска откроется:

http://localhost:5173

# Стек технологий

 • React
 
 • Vite
 
 • React Router
 
 • CSS (без фреймворков)
 
 • Local state (useState)
 

# Структура проекта

src/

│

├── assets/        # картинки, гифки (логотип и тд)

├── components/    # переиспользуемые компоненты (Button, Input, Sidebar и тд)

├── layout/        # layout-компоненты (AuthCard)

├── pages/         # страницы приложения

│   ├── Login.jsx

│   ├── Register.jsx

│   ├── VerifyCode.jsx

│   ├── Chat.jsx

│   ├── Users.jsx

│   ├── Settings.jsx

│   └── Profile.jsx

│

├── context/       # (если используется) глобальные состояния (например настройки)

├── styles/        # стили

│

├── App.jsx        # маршрутизация

├── main.jsx       # точка входа


# Маршруты (router)

Страница / URL

Логин / /login

Регистрация / /register

Подтверждение кода / /verify

Чат/ /chat

Пользователи / /users

Настройки / /settings

Профиль / /profile/:id

# Текущий функционал

Реализовано:

## Авторизация

 • экран логина
 
 • регистрация
 
 • ввод кода подтверждения

## Чат

 • список чатов (sidebar)
 
 • переключение между чатами
 
 • отправка сообщений (локально)
 
 • отображение сообщений

## Пользователи

 • список пользователей
 
 • переход на страницу профиля

## Профиль

 • отображение данных пользователя
 
 • аватарка (если нет — показывается дефолтная)

## Настройки

 • включение/выключение:
 
   • уведомлений
   
   • звука
   
 • изменение:
 
   • фона чата
   
   • размера текста
   
⸻

# Хранение данных (временно)

Сейчас используются:

 • useState
 
 • localStorage

Это временное решение.!!!!

# Что еще НЕ реализовано

• реальные сообщения (WebSocket)

• загрузка файлов

• аватарки пользователей (через сервер)

• защита

• хранение сессии


---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
