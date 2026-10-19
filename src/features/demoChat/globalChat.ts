import { projects, type Project } from "../projects/catalog";
import { projectReplies } from "./projectReplies";

type ChatAction = { to: string; label: string };
export type GlobalTopic = {
  id: string;
  question: string;
  answer: (project?: Project) => string;
  action?: ChatAction;
};
type ChatGroup = { label: string; topics: readonly GlobalTopic[] };
const catalog = { to: "/projects", label: "Открыть каталог" };
const calculator = { to: "/calculator", label: "Перейти к калькулятору" };
const payment = { to: "/payment", label: "Посмотреть способы оплаты" };
const account = { to: "/account", label: "Перейти в кабинет" };
const contacts = { to: "/contacts", label: "Открыть контакты" };
const reply = (id: string) => projectReplies.find((topic) => topic.id === id)!.answer;
const topic = (id: string, question: string, text: string, action?: ChatAction): GlobalTopic => ({
  id,
  question,
  answer: () => text,
  action,
});

export const globalChatGroups = {
  home: {
    label: "Знакомство с ОСНОВОЙ",
    topics: [
      topic(
        "start",
        "Как начать строительство?",
        "Начните с каталога или подбора дома, затем сравните параметры в калькуляторе. ОСНОВА — портфолио: реальные строительные заказы здесь не принимаются.",
        catalog,
      ),
      {
        id: "time",
        question: "Сколько времени занимает строительство дома?",
        answer: reply("time"),
        action: calculator,
      },
      {
        id: "price",
        question: "Как рассчитывается стоимость?",
        answer: reply("price"),
        action: calculator,
      },
      topic(
        "custom",
        "Можно ли заказать индивидуальный проект?",
        "В калькуляторе доступен самостоятельный расчёт параметров. Заказ проектирования и генератор OSNOVA PLAN пока не реализованы; демонстрационные планировки типовых домов можно посмотреть в каталоге.",
        calculator,
      ),
    ],
  },
  projects: {
    label: "Типовые проекты",
    topics: [
      {
        id: "price",
        question: "Что входит в стоимость проекта?",
        answer: reply("price"),
        action: calculator,
      },
      {
        id: "layout",
        question: "Можно ли изменить планировку?",
        answer: reply("layout"),
        action: catalog,
      },
      {
        id: "materials",
        question: "Какие материалы используются?",
        answer: reply("materials"),
        action: calculator,
      },
      { id: "time", question: "Сколько занимает строительство этого дома?", answer: reply("time") },
      topic(
        "stages",
        "Можно ли строить по этапам?",
        "В калькуляторе можно переключиться с формата под ключ на отдельные этапы и выбрать состав работ. Фактическую последовательность, договор и график проверяли бы специалисты; здесь расчёт демонстрационный.",
        calculator,
      ),
    ],
  },
  estimate: {
    label: "Подбор и расчёт",
    topics: [
      topic(
        "accuracy",
        "Насколько точен предварительный расчёт?",
        "Это демонстрационный ориентир, а не профессиональная смета или оферта. Расчёт зависит от введённых параметров, региона, доставки и выбранных работ; участок и рабочий проект потребовали бы отдельной оценки.",
      ),
      topic(
        "factors",
        "От чего зависит итоговая стоимость?",
        "От площади, этажности, высоты, конструктивных материалов, комплектации, региона, доставки и состава этапов. Детализация показана в калькуляторе; реальные условия не подтверждены.",
        calculator,
      ),
      {
        id: "materials",
        question: "Можно ли изменить материалы?",
        answer: reply("materials"),
        action: calculator,
      },
      topic(
        "stages",
        "Что входит в отдельные этапы?",
        "Состав работ и суммы перечислены в детализации калькулятора. Можно выбирать доступные этапы; ограничения и зависимости показываются в форме. Это не рабочая спецификация.",
        calculator,
      ),
      topic(
        "save",
        "Как сохранить расчёт?",
        "Нажмите «Сохранить расчёт» в калькуляторе. После учебного входа сохранённые сметы доступны в кабинете этого браузера. Текущий черновик сохраняется в пределах вкладки; для переноса используйте PDF или сводку.",
        account,
      ),
    ],
  },
  payment: {
    label: "Условия и демо-оформление",
    topics: [
      topic(
        "methods",
        "Какие способы оплаты доступны?",
        "Показаны четыре учебных сценария: наличными полностью, наличными по этапам, кредит и ипотека. У каждого есть отдельная страница условий. Выбрать демо-оформление можно после расчёта и учебного входа.",
        payment,
      ),
      topic(
        "stages",
        "Можно ли оплачивать строительство поэтапно?",
        "Есть сценарий «Наличными по этапам» с демонстрационным графиком. В реальности этапы, приёмка и порядок платежей устанавливаются договором. На сайте деньги не переводятся.",
        payment,
      ),
      topic(
        "mortgage",
        "Как работает ипотека на строительство?",
        "В разделе ипотеки показан пример порядка действий и документов. Банк определял бы ставку, взнос и одобрение; сайт не рассчитывает кредит и не отправляет заявку. Это не действующая банковская программа.",
        { to: "/payment/methods/mortgage", label: "Условия ипотеки" },
      ),
      topic(
        "capital",
        "Можно ли использовать материнский капитал?",
        "На странице оплаты есть справочная информация и ссылка на правила СФР. В демо маткапитал не вычитается из стоимости и не оформляется. Реальную возможность проверяют по действующим правилам и условиям договора.",
        payment,
      ),
      topic(
        "demo",
        "Является ли оплата на сайте настоящей?",
        "Нет. Деньги не списываются, встречи не бронируются, заявки в банк не отправляются. Подтверждение и PDF демонстрационные, не являются договором или кассовым чеком.",
      ),
    ],
  },
  account: {
    label: "Личный кабинет",
    topics: [
      topic(
        "saved",
        "Где найти сохранённый расчёт?",
        "После учебного входа откройте блок «Сохранённые сметы». Они доступны только в этом браузере. Если список пуст, сначала сохраните расчёт в калькуляторе.",
        calculator,
      ),
      topic(
        "compare",
        "Как сравнить несколько проектов?",
        "Добавьте дома в избранное в каталоге. Для сравнения доступно до трёх проектов; выберите их соответствующими кнопками и откройте сравнение.",
        catalog,
      ),
      topic(
        "edit",
        "Как изменить сохранённый проект?",
        "У нужной сметы нажмите «Продолжить расчёт»: параметры откроются в калькуляторе. «Новый расчёт» начинает со стандартных параметров и не удаляет сохранённые сметы.",
        account,
      ),
      topic(
        "history",
        "Как посмотреть историю действий?",
        "Полного журнала действий в кабинете пока нет. Доступны сохранённые сметы с датами и избранное. История этого справочного чата хранится отдельно в текущей вкладке.",
      ),
    ],
  },
  vacancies: {
    label: "Демонстрационные вакансии",
    topics: [
      topic(
        "apply",
        "Как откликнуться на вакансию?",
        "Нажмите «Откликнуться в демо-чате» у вакансии. Откроется локальная имитация отклика; резюме и сообщения компании не отправляются.",
      ),
      topic(
        "remote",
        "Можно ли работать удалённо?",
        "Вакансии — вымышленные примеры. Условия удалённой работы не утверждены; реального найма на сайте нет. Для настоящих предложений используется отдельная ссылка на hh.ru.",
      ),
      topic(
        "selection",
        "Как проходит отбор кандидатов?",
        "Настоящего отбора здесь нет. Демо-чат показывает пример первого обращения, без отправки данных, собеседования или обещания трудоустройства.",
      ),
    ],
  },
  contacts: {
    label: "Контакты",
    topics: [
      topic(
        "contact",
        "Как связаться с компанией?",
        "Компания вымышленная. На странице контактов указаны способы связи с автором портфолио: email, Telegram и ВКонтакте. Сообщение вы отправляете самостоятельно во внешнем приложении.",
        contacts,
      ),
      topic(
        "consultation",
        "Можно ли назначить консультацию?",
        "Реальной записи на консультацию нет. Можно изучить интерфейс демо-оформления или самостоятельно написать автору по указанным контактам.",
        contacts,
      ),
      topic(
        "regions",
        "В каких регионах работает компания?",
        "Региональные офисы относятся к вымышленной истории. Калькулятор содержит демонстрационные региональные коэффициенты, но это не подтверждение работы компании в этих регионах.",
        { to: "/about", label: "О демо-компании" },
      ),
    ],
  },
  info: {
    label: "О проекте",
    topics: [
      topic(
        "demo",
        "Что на сайте является демонстрацией?",
        "Компания, проекты домов, планировки, сотрудники, отзывы, расчёты и операции оформления созданы для портфолио. Они не подтверждают построенные объекты и не заменяют проектную документацию.",
      ),
      topic(
        "next",
        "С чего начать выбор дома?",
        "Откройте каталог или ответьте на вопросы подбора. Затем изучите демонстрационную планировку и сравните параметры в калькуляторе.",
        catalog,
      ),
      topic(
        "contact",
        "Как связаться с автором проекта?",
        "Откройте контакты автора. Этот справочный чат работает локально и не отправляет сообщения человеку.",
        contacts,
      ),
    ],
  },
} satisfies Record<string, ChatGroup>;

export type ChatGroupId = keyof typeof globalChatGroups;
export type ChatTurn = { id: string; group: ChatGroupId; topicId: string; projectId?: string };
export const GLOBAL_CHAT_KEY = "osnova.global-demo-chat.v1";
export function chatContext(pathname: string): { group: ChatGroupId; project?: Project } {
  if (pathname === "/") return { group: "home" };
  if (pathname === "/projects" || pathname.startsWith("/projects/") || pathname === "/compare")
    return {
      group: "projects",
      project: projects.find((item) => pathname === `/projects/${item.number}`),
    };
  if (pathname === "/calculator" || pathname === "/find-home") return { group: "estimate" };
  if (pathname === "/payment" || pathname.startsWith("/payment/")) return { group: "payment" };
  if (pathname === "/account") return { group: "account" };
  if (pathname === "/vacancies") return { group: "vacancies" };
  if (pathname === "/contacts") return { group: "contacts" };
  return { group: "info" };
}
export function turnContent(turn: ChatTurn) {
  const item: GlobalTopic | undefined = globalChatGroups[turn.group].topics.find(
    (topic) => topic.id === turn.topicId,
  );
  if (!item) return null;
  const project = projects.find((project) => project.number === turn.projectId);
  return { question: item.question, answer: item.answer(project), action: item.action };
}
export function readGlobalChat(storage: Pick<Storage, "getItem">): ChatTurn[] {
  try {
    const raw: unknown = JSON.parse(storage.getItem(GLOBAL_CHAT_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((value): value is ChatTurn => {
        if (
          !value ||
          typeof value !== "object" ||
          typeof value.id !== "string" ||
          typeof value.group !== "string" ||
          !Object.hasOwn(globalChatGroups, value.group) ||
          typeof value.topicId !== "string"
        )
          return false;
        if (
          value.projectId !== undefined &&
          !projects.some((project) => project.number === value.projectId)
        )
          return false;
        return globalChatGroups[value.group as ChatGroupId].topics.some(
          (topic) => topic.id === value.topicId,
        );
      })
      .slice(-30);
  } catch {
    return [];
  }
}
