import { prisma } from "./prisma";
import { decryptSecret, encryptSecret } from "./encryption";

export interface RemnawaveConfig {
  apiUrl: string;
  apiKey: string;
  squadName: string;
}

const DEFAULTS = {
  apiUrl: "",
  apiKey: "",
  squadName: "MainSquad",
};

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) return null;
  if (setting.isSecret) {
    try {
      return decryptSecret(setting.value);
    } catch {
      return null;
    }
  }
  return setting.value;
}

export async function setSetting(
  key: string,
  value: string,
  isSecret = false
): Promise<void> {
  const storedValue = isSecret ? encryptSecret(value) : value;
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: storedValue, isSecret },
    update: { value: storedValue, isSecret },
  });
}

export async function getRemnawaveConfig(): Promise<RemnawaveConfig> {
  const [apiUrl, apiKey, squadName] = await Promise.all([
    getSetting("remnawave_api_url"),
    getSetting("remnawave_api_key"),
    getSetting("remnawave_squad_name"),
  ]);

  return {
    apiUrl: apiUrl ?? process.env.REMNAWAVE_API_URL ?? DEFAULTS.apiUrl,
    apiKey: apiKey ?? process.env.REMNAWAVE_API_KEY ?? DEFAULTS.apiKey,
    squadName: squadName ?? process.env.REMNAWAVE_SQUAD_NAME ?? DEFAULTS.squadName,
  };
}

export async function getRemnawaveConfigForAdmin(): Promise<
  RemnawaveConfig & { apiKeyMasked: string; hasApiKey: boolean }
> {
  const config = await getRemnawaveConfig();
  return {
    ...config,
    apiKey: "",
    hasApiKey: Boolean(config.apiKey),
    apiKeyMasked: config.apiKey
      ? `${config.apiKey.slice(0, 4)}${"•".repeat(12)}${config.apiKey.slice(-4)}`
      : "",
  };
}
