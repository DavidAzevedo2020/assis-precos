import {
  dfdSchema,
  etpSchema,
  notaTecnicaSchema,
} from "../document-schemas";
import { buildDfdUserMessage, DFD_SYSTEM_PROMPT } from "./dfd";
import { buildEtpUserMessage, ETP_SYSTEM_PROMPT } from "./etp";
import {
  buildNotaTecnicaUserMessage,
  NOTA_TECNICA_SYSTEM_PROMPT,
} from "./nota-tecnica";

export const documentPromptRegistry = {
  DFD: {
    schema: dfdSchema,
    systemPrompt: DFD_SYSTEM_PROMPT,
    buildUserMessage: buildDfdUserMessage,
  },
  ETP: {
    schema: etpSchema,
    systemPrompt: ETP_SYSTEM_PROMPT,
    buildUserMessage: buildEtpUserMessage,
  },
  NOTA_TECNICA: {
    schema: notaTecnicaSchema,
    systemPrompt: NOTA_TECNICA_SYSTEM_PROMPT,
    buildUserMessage: buildNotaTecnicaUserMessage,
  },
} as const;
