import { getRemnawaveConfig } from "./settings";
import { createAuditLog } from "./audit";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface RemnawaveUser {
  uuid: string;
  username: string;
  status: string;
  expireAt: string;
  subscriptionUrl: string;
  shortUuid?: string;
}

export interface RemnawaveInternalSquad {
  uuid: string;
  name: string;
}

export class RemnawaveError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "RemnawaveError";
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function remnawaveFetch<T>(
  path: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<T> {
  const config = await getRemnawaveConfig();

  if (!config.apiUrl || !config.apiKey) {
    throw new RemnawaveError("Remnawave API не настроен");
  }

  const url = `${config.apiUrl.replace(/\/$/, "")}${path}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          ...options.headers,
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new RemnawaveError(
          `Remnawave API error: ${response.status}`,
          response.status,
          body
        );
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries - 1) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  throw lastError ?? new RemnawaveError("Remnawave API request failed");
}

export async function testRemnawaveConnection(): Promise<{
  success: boolean;
  message: string;
  userCount?: number;
}> {
  try {
    const data = await remnawaveFetch<{ total?: number; users?: unknown[] }>(
      "/users?size=1"
    );
    return {
      success: true,
      message: "Подключение успешно",
      userCount: data.total,
    };
  } catch (error) {
    const message =
      error instanceof RemnawaveError
        ? error.message
        : "Ошибка подключения к Remnawave";
    return { success: false, message };
  }
}

export async function createRemnawaveUser(params: {
  username: string;
  email?: string;
  telegramUsername?: string;
}): Promise<RemnawaveUser> {
  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + 1);

  const body: Record<string, unknown> = {
    username: params.username,
    expireAt: expireAt.toISOString(),
    status: "ACTIVE",
    trafficLimitBytes: 0,
    trafficLimitStrategy: "NO_RESET",
  };

  if (params.email) {
    body.email = params.email;
  }

  const data = await remnawaveFetch<Record<string, unknown>>("/users", {
    method: "POST",
    body: JSON.stringify(body),
  });

  await createAuditLog({
    actorType: "SYSTEM",
    action: "remnawave.user.created",
    details: { username: params.username, uuid: data.uuid },
  });

  return mapUserResponse(data);
}

export async function getRemnawaveUserByUuid(
  uuid: string
): Promise<RemnawaveUser> {
  const data = await remnawaveFetch<Record<string, unknown>>(
    `/users/${uuid}`
  );
  return mapUserResponse(data);
}

export async function getRemnawaveUserByUsername(
  username: string
): Promise<RemnawaveUser> {
  const data = await remnawaveFetch<Record<string, unknown>>(
    `/users/by-username/${encodeURIComponent(username)}`
  );
  return mapUserResponse(data.response ?? data);
}

export async function updateRemnawaveSubscription(params: {
  uuid: string;
  durationDays: number;
  squadName: string;
}): Promise<RemnawaveUser> {
  const config = await getRemnawaveConfig();
  const squadUuid = await getInternalSquadUuid(
    params.squadName || config.squadName
  );

  let currentUser: RemnawaveUser;
  try {
    currentUser = await getRemnawaveUserByUuid(params.uuid);
  } catch {
    currentUser = { uuid: params.uuid, expireAt: new Date().toISOString() } as RemnawaveUser;
  }

  const baseDate = new Date(currentUser.expireAt);
  const now = new Date();
  const startFrom = baseDate > now ? baseDate : now;
  const newExpireAt = new Date(startFrom);
  newExpireAt.setDate(newExpireAt.getDate() + params.durationDays);

  const body: Record<string, unknown> = {
    uuid: params.uuid,
    expireAt: newExpireAt.toISOString(),
    status: "ACTIVE",
  };

  if (squadUuid) {
    body.activeInternalSquads = [squadUuid];
  }

  const data = await remnawaveFetch<Record<string, unknown>>("/users", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  await createAuditLog({
    actorType: "SYSTEM",
    action: "remnawave.subscription.updated",
    details: {
      uuid: params.uuid,
      durationDays: params.durationDays,
      expireAt: newExpireAt.toISOString(),
      squadName: params.squadName,
    },
  });

  return mapUserResponse(data.response ?? data);
}

export async function getInternalSquadUuid(
  squadName: string
): Promise<string | null> {
  try {
    const data = await remnawaveFetch<{
      response?: { internalSquads?: RemnawaveInternalSquad[] };
      internalSquads?: RemnawaveInternalSquad[];
    }>("/internal-squads");

    const squads =
      data.response?.internalSquads ?? data.internalSquads ?? [];

    const squad = squads.find(
      (s) => s.name.toLowerCase() === squadName.toLowerCase()
    );
    return squad?.uuid ?? null;
  } catch {
    return null;
  }
}

function mapUserResponse(data: unknown): RemnawaveUser {
  const record = (data ?? {}) as Record<string, unknown>;
  return {
    uuid: String(record.uuid ?? ""),
    username: String(record.username ?? ""),
    status: String(record.status ?? "UNKNOWN"),
    expireAt: String(record.expireAt ?? record.expire_at ?? new Date().toISOString()),
    subscriptionUrl: String(
      record.subscriptionUrl ?? record.subscription_url ?? ""
    ),
    shortUuid: record.shortUuid
      ? String(record.shortUuid)
      : record.short_uuid
        ? String(record.short_uuid)
        : undefined,
  };
}

export async function disableRemnawaveUser(uuid: string): Promise<void> {
  await remnawaveFetch(`/users/${uuid}/actions/disable`, {
    method: "POST",
  });
}

export async function enableRemnawaveUser(uuid: string): Promise<void> {
  await remnawaveFetch(`/users/${uuid}/actions/enable`, {
    method: "POST",
  });
}

export async function deleteRemnawaveUser(uuid: string): Promise<void> {
  await remnawaveFetch(`/users/${uuid}`, { method: "DELETE" });
}
