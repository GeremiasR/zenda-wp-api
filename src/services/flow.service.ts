import mongoose from "mongoose";
import { Flow, IFlow, MessageSession, IMessageSession } from "../models";

export class FlowService {
  private static instance: FlowService;

  private constructor() {}

  public static getInstance(): FlowService {
    if (!FlowService.instance) {
      FlowService.instance = new FlowService();
    }
    return FlowService.instance;
  }

  /**
   * Obtener un flujo por ID
   */
  public async getFlowById(flowId: string): Promise<IFlow | null> {
    try {
      return await Flow.findOne({
        _id: flowId,
        isActive: true,
        isDeleted: false,
      });
    } catch (error) {
      console.error("Error al obtener el flujo:", error);
      return null;
    }
  }

  /**
   * Obtener un flujo por número de teléfono
   */
  public async getFlowByPhoneNumber(
    phoneNumber: string
  ): Promise<IFlow | null> {
    try {
      return await Flow.findOne({
        phoneNumber,
        isActive: true,
        isDeleted: false,
      });
    } catch (error) {
      console.error("Error al obtener el flujo por número de teléfono:", error);
      return null;
    }
  }

  /**
   * Obtener o crear una sesión de mensajes por flowId
   */
  public async getOrCreateMessageSessionByFlow(
    from: string,
    to: string,
    flowId: string
  ): Promise<{
    session: IMessageSession | null;
    isNew: boolean;
  }> {
    try {
      // Buscar una sesión existente
      let session = await MessageSession.findOne({ from, to, flowId });

      // Si existe la sesión, devolverla
      if (session) {
        return { session, isNew: false };
      }

      // Si no existe la sesión, crear una nueva
      session = new MessageSession({
        from,
        to,
        flowId,
        currentState: "initial", // Se actualizará con el initialState del flow
      });

      await session.save();

      return { session, isNew: true };
    } catch (error) {
      console.error(
        "Error al obtener o crear sesión de mensajes por flowId:",
        error
      );
      return { session: null, isNew: false };
    }
  }

  /**
   * Obtener o crear una sesión de mensajes
   */
  public async getOrCreateMessageSession(
    from: string,
    to: string
  ): Promise<{
    session: IMessageSession | null;
    flow: IFlow | null;
    isNew: boolean;
  }> {
    try {
      // Buscar una sesión existente
      let session = await MessageSession.findOne({ from, to });

      // Si existe la sesión, obtener el flujo asociado
      if (session) {
        const flow = await this.getFlowById(session.flowId.toString());
        return { session, flow, isNew: false };
      }

      // Si no existe la sesión, buscar el flujo por el número de destino (to)
      const flow = await this.getFlowByPhoneNumber(to);

      if (!flow) {
        return { session: null, flow: null, isNew: false };
      }

      // Crear una nueva sesión
      session = new MessageSession({
        shopId: flow.shopId,
        from,
        to,
        flowId: flow._id,
        currentState: flow.initialState,
      });

      await session.save();

      return { session, flow, isNew: true };
    } catch (error) {
      console.error("Error al obtener o crear sesión de mensajes:", error);
      return { session: null, flow: null, isNew: false };
    }
  }

  /**
   * Procesar un mensaje entrante según el flujo de conversación usando flowId
   */
  public async processMessageByFlowId(
    from: string,
    to: string,
    message: string,
    flowId: string
  ): Promise<{ response: string; sessionUpdated: boolean }> {
    try {
      // Obtener el flujo por ID
      const flow = await this.getFlowById(flowId);
      if (!flow) {
        return {
          response: "Lo siento, no se encontró el flujo configurado.",
          sessionUpdated: false,
        };
      }

      // Obtener o crear la sesión de mensajes
      const { session, isNew } = await this.getOrCreateMessageSessionByFlow(
        from,
        to,
        flowId
      );

      // Si no hay sesión, devolver un mensaje de error
      if (!session) {
        return {
          response: "Lo siento, no se pudo crear la sesión de mensajes.",
          sessionUpdated: false,
        };
      }

      // Si es una sesión nueva, enviar el mensaje del estado inicial
      if (isNew) {
        const initialState = flow.states[flow.initialState];
        return {
          response: initialState.message,
          sessionUpdated: true,
        };
      }

      // Obtener el siguiente estado basado en el input del usuario
      const nextStateResult = flow.getNextState(session.currentState, message);

      if (nextStateResult) {
        // Actualizar la sesión con el nuevo estado
        session.currentState = nextStateResult.nextState;
        session.lastActivity = new Date();
        await session.save();

        // Obtener el mensaje del nuevo estado
        const newState = flow.states[nextStateResult.nextState];
        return {
          response: newState.message,
          sessionUpdated: true,
        };
      } else {
        // No se encontró una transición válida, mantener el estado actual
        const currentState = flow.states[session.currentState];
        return {
          response: currentState.message,
          sessionUpdated: false,
        };
      }
    } catch (error) {
      console.error("Error al procesar mensaje por flowId:", error);
      return {
        response: "Lo siento, ocurrió un error al procesar tu mensaje.",
        sessionUpdated: false,
      };
    }
  }

  /**
   * Procesar un mensaje entrante según el flujo de conversación
   */
  public async processMessage(
    from: string,
    to: string,
    message: string
  ): Promise<{ response: string; sessionUpdated: boolean }> {
    try {
      // Obtener o crear la sesión de mensajes
      const { session, flow, isNew } = await this.getOrCreateMessageSession(
        from,
        to
      );

      // Si no hay sesión o flujo, devolver un mensaje de error
      if (!session || !flow) {
        return {
          response: "Lo siento, no hay un flujo configurado para este número.",
          sessionUpdated: false,
        };
      }

      // Si es una sesión nueva, enviar el mensaje del estado inicial
      if (isNew) {
        const initialState = flow.states[flow.initialState];
        return {
          response: initialState.message,
          sessionUpdated: true,
        };
      }

      // Obtener el estado actual
      const sessionState = flow.states[session.currentState];

      if (!sessionState) {
        // Si el estado no existe, reiniciar al estado inicial
        session.currentState = flow.initialState;
        await session.save();

        const initialState = flow.states[flow.initialState];

        return {
          response: initialState.message,
          sessionUpdated: true,
        };
      }

      // Buscar la siguiente transición basada en el mensaje del usuario
      const currentState = sessionState;

      // Si no hay opciones disponibles o el estado no existe, reiniciar
      if (
        !currentState ||
        !currentState.options ||
        currentState.options.length === 0
      ) {
        return {
          response: "Lo siento, ocurrió un error. Intentemos de nuevo.",
          sessionUpdated: false,
        };
      }

      // Normalizar input del usuario
      const normalizedInput = message.toLowerCase().trim();
      let nextTransition: { nextState: string; event: string } | null = null;

      // Buscar la opción que coincida con el input del usuario
      for (const option of currentState.options) {
        for (const input of option.input) {
          if (
            normalizedInput === input.toLowerCase() ||
            normalizedInput.includes(input.toLowerCase())
          ) {
            nextTransition = {
              nextState: option.next,
              event: option.event,
            };
            break;
          }
        }
        if (nextTransition) break;
      }

      if (!nextTransition) {
        // Si no hay transición válida, enviar mensaje de error genérico
        return {
          response:
            "No entiendo lo que quieres decir. Por favor, elige una de las opciones disponibles.",
          sessionUpdated: false,
        };
      }

      // Actualizar el estado de la sesión
      const { nextState } = nextTransition;
      session.currentState = nextState;
      await session.save();

      // Obtener el mensaje del nuevo estado
      const newState = flow.states[nextState];

      return {
        response: newState.message,
        sessionUpdated: true,
      };
    } catch (error) {
      console.error("Error al procesar el mensaje:", error);
      return {
        response: "Lo siento, ha ocurrido un error al procesar tu mensaje.",
        sessionUpdated: false,
      };
    }
  }

  /**
   * Crear un flujo de ejemplo (para usar como mock)
   */
  public async createExampleFlow(shopId: string): Promise<IFlow> {
    // Validar el formato de shopId
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      throw new Error("ID de tienda inválido");
    }

    const mockFlow = {
      name: "Flujo de ejemplo",
      description: "Flujo de ejemplo para una tienda de estética",
      phoneNumber: "5491123456789", // Número de ejemplo
      shopId: new mongoose.Types.ObjectId(shopId),
      isActive: true,
      isDeleted: false,
      initialState: "menu",
      states: {
        menu: {
          message:
            "Bienvenida/o 👋, elige una opción:\n1) Solicitar turno\n2) Alquilar máquina\n3) Servicios\n4) Productos\n5) Contacto",
          options: [
            {
              input: ["1", "turno", "reserva"],
              event: "TURNO",
              next: "solicitar_turno",
            },
            {
              input: ["2", "maquina", "alquilar"],
              event: "MAQUINA",
              next: "alquilar_maquina",
            },
            { input: ["3", "servicio"], event: "SERVICIOS", next: "servicios" },
            { input: ["4", "producto"], event: "PRODUCTOS", next: "productos" },
            { input: ["5", "contacto"], event: "CONTACTO", next: "contacto" },
          ],
        },
        solicitar_turno: {
          message: "📅 ¿Qué día te gustaría reservar el turno?",
          options: [
            { input: ["back"], event: "BACK", next: "menu" },
            {
              input: [
                "lunes",
                "martes",
                "miércoles",
                "jueves",
                "viernes",
                "sábado",
              ],
              event: "FECHA",
              next: "confirmar_turno",
            },
          ],
        },
        confirmar_turno: {
          message:
            "Perfecto 🙌, reservamos tu turno ese día. ¿Quieres confirmar? (si/no)",
          options: [
            {
              input: ["si", "confirmar"],
              event: "CONFIRMAR",
              next: "turno_confirmado",
            },
            { input: ["no"], event: "CANCELAR", next: "menu" },
          ],
        },
        turno_confirmado: {
          message: "✅ ¡Tu turno quedó confirmado! Muchas gracias 💆‍♀️",
          options: [{ input: ["menu", "volver"], event: "BACK", next: "menu" }],
        },
        alquilar_maquina: {
          message:
            "💻 ¿Qué máquina deseas alquilar?\n- Presoterapia\n- Cavitación\n- Radiofrecuencia",
          options: [
            {
              input: ["presoterapia"],
              event: "MAQUINA_PRESO",
              next: "confirmar_alquiler",
            },
            {
              input: ["cavitación"],
              event: "MAQUINA_CAVI",
              next: "confirmar_alquiler",
            },
            {
              input: ["radiofrecuencia"],
              event: "MAQUINA_RADIO",
              next: "confirmar_alquiler",
            },
            { input: ["back"], event: "BACK", next: "menu" },
          ],
        },
        confirmar_alquiler: {
          message:
            "👌 Excelente elección. ¿Quieres confirmar el alquiler? (si/no)",
          options: [
            { input: ["si"], event: "CONFIRMAR", next: "alquiler_confirmado" },
            { input: ["no"], event: "CANCELAR", next: "menu" },
          ],
        },
        alquiler_confirmado: {
          message: "✅ ¡Alquiler confirmado! Gracias por tu confianza.",
          options: [{ input: ["menu"], event: "BACK", next: "menu" }],
        },
        servicios: {
          message:
            "Nuestros servicios son:\n✨ Depilación\n✨ Masajes\n✨ Tratamientos faciales\n¿Quieres info de alguno?",
          options: [
            {
              input: ["depilación"],
              event: "SERV_DEPILACION",
              next: "detalle_servicio",
            },
            {
              input: ["masajes"],
              event: "SERV_MASAJES",
              next: "detalle_servicio",
            },
            {
              input: ["faciales"],
              event: "SERV_FACIALES",
              next: "detalle_servicio",
            },
            { input: ["back"], event: "BACK", next: "menu" },
          ],
        },
        detalle_servicio: {
          message:
            "📖 Aquí tienes el detalle del servicio seleccionado. ¿Quieres reservar un turno? (si/no)",
          options: [
            { input: ["si"], event: "RESERVAR", next: "solicitar_turno" },
            { input: ["no"], event: "CANCELAR", next: "menu" },
          ],
        },
        productos: {
          message:
            "Tenemos disponibles:\n🧴 Cremas\n🌿 Aceites\n🎁 Packs promocionales\n¿Quieres ver el catálogo online?",
          options: [
            {
              input: ["si", "catalogo"],
              event: "CATALOGO",
              next: "link_catalogo",
            },
            { input: ["back"], event: "BACK", next: "menu" },
          ],
        },
        link_catalogo: {
          message: "Aquí tienes el catálogo: https://mieshop.com/catalogo 📲",
          options: [{ input: ["menu"], event: "BACK", next: "menu" }],
        },
        contacto: {
          message:
            "☎️ Puedes comunicarte con nosotros:\n- WhatsApp directo\n- Llamada\n- Visítanos en el local.\n¿Quieres que te contacte una persona?",
          options: [
            {
              input: ["si", "humano", "asesor"],
              event: "HUMANO",
              next: "contacto_humano",
            },
            { input: ["no", "menu"], event: "BACK", next: "menu" },
          ],
        },
        contacto_humano: {
          message: "Un asesor se pondrá en contacto contigo en breve 🙋‍♀️",
          options: [{ input: ["menu"], event: "BACK", next: "menu" }],
        },
      },
    };

    // Verificar si ya existe un flujo similar
    const existingFlow = await Flow.findOne({
      phoneNumber: mockFlow.phoneNumber,
      shopId: mockFlow.shopId,
      isDeleted: false,
    });

    if (existingFlow) {
      return existingFlow;
    }

    // Crear y guardar el nuevo flujo
    const flow = new Flow(mockFlow);
    await flow.save();

    return flow;
  }
}

export const flowService = FlowService.getInstance();
export default flowService;
