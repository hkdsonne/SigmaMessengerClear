import ErrorPageLayout from "../components/ErrorPageLayout";

export default function Error404() {
  return (
    <ErrorPageLayout
      code="404"
      subtitle="Я хотел сказать"
      title="Этой страницы не существует"
      description="Похоже, адрес введён неверно или страница была перемещена. Попробуй вернуться назад или открыть главную страницу приложения."
    />
  );
}