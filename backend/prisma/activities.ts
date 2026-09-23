import { Scenario, type Prisma } from "../src/generated/prisma/client.js";

// Copied from frontend/src/data/catalog.ts (ids must stay in sync).
export const activities: Prisma.ActivityCreateInput[] = [
  {
    "id": "exercises-0",
    "name": "Respiração consciente",
    "category": "Respiração",
    "description": "Encontre uma respiração natural e confortável.",
    "durationMinutes": 3,
    "steps": [
      "Sente-se em uma posição confortável.",
      "Observe sua respiração sem forçar.",
      "Inspire e expire suavemente, mantendo a atenção no presente."
    ],
    "icon": "wind",
    "color": "green",
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.VITALITY,
    "protocolOrder": 1
  },
  {
    "id": "exercises-1",
    "name": "Mobilização pélvica",
    "category": "Movimento corporal",
    "description": "Explore movimentos suaves, no seu ritmo.",
    "durationMinutes": 5,
    "steps": [
      "Fique em pé com os pés na largura dos ombros.",
      "Relaxe os joelhos.",
      "Movimente suavemente a pelve para frente e para trás.",
      "Execute lentamente entre 10 e 15 repetições."
    ],
    "icon": "activity",
    "color": null,
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.VITALITY,
    "protocolOrder": 2
  },
  {
    "id": "exercises-2",
    "name": "Cromoterapia · laranja",
    "category": "Prática de equilíbrio",
    "description": "Um momento de atenção às cores e sensações.",
    "durationMinutes": 5,
    "steps": [
      "Escolha um ambiente confortável.",
      "Observe um objeto ou imagem em tom laranja.",
      "Perceba suas sensações, sem esperar um resultado específico."
    ],
    "icon": "sun",
    "color": "orange",
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.VITALITY,
    "protocolOrder": 3
  },
  {
    "id": "exercises-3",
    "name": "Mantra VAM",
    "category": "Expressão",
    "description": "Experimente som e presença com suavidade.",
    "durationMinutes": 5,
    "steps": [
      "Sente-se confortavelmente.",
      "Respire naturalmente.",
      "Se desejar, vocalize VAM em volume confortável."
    ],
    "icon": "wind",
    "color": "rose",
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.VITALITY,
    "protocolOrder": 4
  },
  {
    "id": "exercises-4",
    "name": "Dança livre",
    "category": "Movimento corporal",
    "description": "Dê espaço à criatividade através do movimento.",
    "durationMinutes": 7,
    "steps": [
      "Escolha uma música de que goste.",
      "Deixe espaço livre ao seu redor.",
      "Movimente-se livremente, respeitando seus limites."
    ],
    "icon": "activity",
    "color": "rose",
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.VITALITY,
    "protocolOrder": 5
  },
  {
    "id": "exercises-5",
    "name": "Relaxamento",
    "category": "Relaxamento",
    "description": "Finalize com um momento de pausa.",
    "durationMinutes": 5,
    "steps": [
      "Encontre uma posição confortável.",
      "Solte os ombros e observe a respiração.",
      "Permaneça alguns minutos em silêncio."
    ],
    "icon": "leaf",
    "color": "green",
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.VITALITY,
    "protocolOrder": 6
  },
  {
    "id": "calmExercises-0",
    "name": "Respiração abdominal",
    "category": "Respiração",
    "description": "Uma pausa para desacelerar.",
    "durationMinutes": 3,
    "steps": [
      "Sente-se confortavelmente.",
      "Se for confortável, inspire por cerca de 4 segundos.",
      "Expire por cerca de 6 segundos, sem prender ou forçar a respiração."
    ],
    "icon": "wind",
    "color": "green",
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.CALM,
    "protocolOrder": 1
  },
  {
    "id": "calmExercises-1",
    "name": "Caminhada consciente",
    "category": "Presença",
    "description": "Caminhe com atenção ao momento presente.",
    "durationMinutes": 5,
    "steps": [
      "Escolha um local seguro e plano.",
      "Caminhe lentamente.",
      "Observe o contato dos pés com o chão."
    ],
    "icon": "activity",
    "color": "green",
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.CALM,
    "protocolOrder": 2
  },
  {
    "id": "calmExercises-2",
    "name": "Cores suaves",
    "category": "Cromoterapia",
    "description": "Atenção às cores suaves e terrosas.",
    "durationMinutes": 5,
    "steps": [
      "Sente-se em um lugar tranquilo.",
      "Observe cores suaves ao seu redor.",
      "Perceba suas sensações sem expectativas."
    ],
    "icon": "sun",
    "color": "green",
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.CALM,
    "protocolOrder": 3
  },
  {
    "id": "calmExercises-3",
    "name": "Atenção plena",
    "category": "Presença",
    "description": "Observe, acolha e retorne ao presente.",
    "durationMinutes": 5,
    "steps": [
      "Encontre uma posição confortável.",
      "Observe sons, sensações e pensamentos.",
      "Retorne gentilmente à respiração."
    ],
    "icon": "leaf",
    "color": "green",
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.CALM,
    "protocolOrder": 4
  },
  {
    "id": "calmExercises-4",
    "name": "Alongamento suave",
    "category": "Movimento corporal",
    "description": "Movimentos lentos e confortáveis.",
    "durationMinutes": 7,
    "steps": [
      "Relaxe os ombros.",
      "Alongue braços e pernas suavemente.",
      "Não force amplitudes nem movimentos."
    ],
    "icon": "activity",
    "color": "green",
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.CALM,
    "protocolOrder": 5
  },
  {
    "id": "calmExercises-5",
    "name": "Relaxamento",
    "category": "Relaxamento",
    "description": "Finalize com um momento de pausa.",
    "durationMinutes": 5,
    "steps": [
      "Encontre uma posição confortável.",
      "Solte os ombros e observe a respiração.",
      "Permaneça alguns minutos em silêncio."
    ],
    "icon": "leaf",
    "color": "green",
    "videoId": "XRYGnFuzH34",
    "scenario": Scenario.CALM,
    "protocolOrder": 6
  },
  {
    "id": "extraExercises-0",
    "name": "Rotação de quadril",
    "category": "Movimento corporal",
    "description": "Movimentos circulares suaves.",
    "durationMinutes": 5,
    "steps": [
      "Mantenha os pés apoiados.",
      "Faça 10 círculos suaves com o quadril para cada lado.",
      "Respeite uma amplitude confortável."
    ],
    "icon": "activity",
    "color": "orange",
    "videoId": "XRYGnFuzH34",
    "scenario": null,
    "protocolOrder": null
  },
  {
    "id": "extraExercises-1",
    "name": "Postura da borboleta",
    "category": "Alongamento",
    "description": "Uma pausa para alongar suavemente.",
    "durationMinutes": 2,
    "steps": [
      "Sente-se confortavelmente.",
      "Aproxime as plantas dos pés sem forçar os joelhos.",
      "Permaneça de 1 a 2 minutos, se confortável."
    ],
    "icon": "flower",
    "color": "rose",
    "videoId": "XRYGnFuzH34",
    "scenario": null,
    "protocolOrder": null
  },
  {
    "id": "extraExercises-2",
    "name": "Gato-vaca",
    "category": "Movimento corporal",
    "description": "Explore a mobilidade com gentileza.",
    "durationMinutes": 6,
    "steps": [
      "Apoie mãos e joelhos em superfície confortável.",
      "Arredonde e estenda suavemente a coluna, sem forçar.",
      "Realize de 8 a 10 repetições confortáveis."
    ],
    "icon": "activity",
    "color": "green",
    "videoId": "XRYGnFuzH34",
    "scenario": null,
    "protocolOrder": null
  }
];
