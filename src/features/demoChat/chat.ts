import { projectUrl, publishableKey } from "../backend/config";

export const chatTopics = [
  {
    code: "choose_project",
    question: "Как выбрать проект?",
    answer:
      "Добавьте понравившиеся концепты в избранное и сравните до трёх домов. Затем откройте карточку каждого проекта: там показаны планировка, материалы и демонстрационный ориентир стоимости.",
  },
  {
    code: "estimate",
    question: "Что показывает калькулятор?",
    answer:
      "Калькулятор показывает примерный диапазон для портфолио. Его цены и сроки условные и не являются сметой или предложением на строительство. Параметры и состав этапов можно менять прямо в форме.",
  },
  {
    code: "timeline",
    question: "Сколько длится строительство?",
    answer:
      "На сайте приведены только демонстрационные сроки. Реальный график зависит от проекта, участка, сезона и подрядчика; подтверждённого календарного плана здесь нет.",
  },
  {
    code: "contact_author",
    question: "Как связаться с автором?",
    answer:
      "Используйте email, Telegram или ВКонтакте в блоке контактов. Вы сами проверяете и отправляете сообщение во внешнем приложении; этот чат не связывает с менеджером.",
  },
] as const;

export type ChatTopic = (typeof chatTopics)[number];

export async function submitDemoChatTurn(clientTurnId: string, topicCode: ChatTopic["code"]) {
  const response = await fetch(`${projectUrl}/rest/v1/rpc/submit_demo_chat_turn`, {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ p_client_turn_id: clientTurnId, p_topic_code: topicCode }),
  });
  if (!response.ok) throw new Error(response.status === 429 ? "limit" : "request");
  const id: unknown = await response.json();
  if (typeof id !== "string") throw new Error("response");
  return id;
}
