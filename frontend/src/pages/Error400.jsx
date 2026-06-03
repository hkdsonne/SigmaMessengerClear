import ErrorPageLayout from "../components/ErrorPageLayout2";

export default function Error400() {
  return (
    <ErrorPageLayout
      code="400"
      subtitle="Я хотел сказать"
      title="В запросе есть ошибка"
      description="Сервер получил данные, но не смог их обработать. Проверь, правильно ли заполнены поля формы и нет ли ошибок во введённых данных."
    />
  );
}