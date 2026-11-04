/**
 * Vault key supply chain — spec 0.8.0 RUNTIME-059 (dp-vault-key-supply-m1).
 *
 * 包 Web 的声明键取值链（design D5）：
 *   direct env 值有 → 用（dev 直供兼容，零行为变化）
 *     ↓ 无
 *   VAULT_TOKEN 存在 → POST VAULT_ENDPOINT { key_name } → 成功 → 进内存 Map
 *     ↓ 401/无效 token      ↓ 网络不可达            ↓ 404/403
 *   fail-fast「需登录」    fail-fast「平台不可达」   fail-fast「平台未配置」
 *     ↓ VAULT_TOKEN 不存在（未登录且无 direct 值）
 *   fail-fast「请登录后使用该能力」
 *
 * 契约要点（RUNTIME-059）：
 * - lazy：仅 requireEnvValue 真被调用时发起（装包未配 key 不阻断浏览）
 * - 内存 only：拉取值只进本进程 Map——不得写盘、不得回写 environment
 * - 会话缓存：per-process Map，轮换池值后下次冷启动生效
 * - 文案三分（RUNTIME-058）：not-signed-in / vault-unreachable / key-not-enabled
 *   三类失败层各带可区分的用户文案
 *
 * 发放 API 契约（apps/web `POST /api/vault/issue`）：
 * - 成功 200 { ok: true, key_name, key_value }
 * - 401 invalid_token；404 unknown_key；403 disabled_key / llm_key_rejected
 * - 5xx 视为平台侧暂时不可用
 */
export const VAULT_PROTOCOL_ENV_NAMES = new Set(["VAULT_TOKEN", "VAULT_ENDPOINT"]);

const FAIL_FAST_MESSAGES = {
  "not-signed-in": (name) =>
    `「${name}」需要登录后使用——请先登录 TheFoolAI 账号，再使用该能力。`,
  "vault-unreachable": (name) =>
    `「${name}」的平台密钥服务暂时不可达（网络或平台故障）——请检查网络后重试。`,
  "key-not-enabled": (name) =>
    `「${name}」尚未在平台配置——请联系平台管理员启用该 key。`,
};

function failFast(code, keyName, detail) {
  const error = new Error(FAIL_FAST_MESSAGES[code](keyName) + (detail ? `（${detail}）` : ""));
  error.code = code;
  error.keyName = keyName;
  return error;
}

/**
 * 创建声明键取值链。包业务代码在能力执行处调用 requireEnvValue(name)；
 * 返回的 Promise reject 的错误带 code（三分失败层）与用户可读 message。
 *
 * @param {object} [options]
 * @param {Record<string, string | undefined>} [options.environment] 进程环境
 *   （默认 process.env；测试注入）
 * @param {typeof fetch} [options.fetchImpl] fetch 实现（默认全局 fetch；测试注入）
 * @param {Pick<Console, "log">} [options.logger]
 */
export function createVaultSupply({
  environment = process.env,
  fetchImpl = null,
  logger = console,
} = {}) {
  // 未注入时惰性解析全局 fetch（每次调用时查 globalThis）——测试 stub 与
  // 运行时替换才能生效；默认参数会在创建时固定引用，stub 不再可见。
  const resolveFetch =
    typeof fetchImpl === "function" ? () => fetchImpl : () => fetch;
  /** 会话级缓存：key_name → key_value。仅内存，永不落盘。 */
  const cache = new Map();

  async function requireEnvValue(name) {
    // 链一：direct env（dev 直供 / 主进程已注入的声明键值）。空白视为缺失，
    // 与包业务侧 readTrimmed 的「空白=missing」语义一致。
    const direct = typeof environment[name] === "string" ? environment[name].trim() : "";
    if (direct.length > 0) return direct;

    const cached = cache.get(name);
    if (cached !== undefined) return cached;

    const token = environment.VAULT_TOKEN;
    if (typeof token !== "string" || token.length === 0) {
      throw failFast("not-signed-in", name);
    }
    const endpoint = environment.VAULT_ENDPOINT;
    if (typeof endpoint !== "string" || endpoint.length === 0) {
      // 有 token 无 endpoint = App 供给面残缺，按通道故障报（与网络断同层）
      throw failFast("vault-unreachable", name, "VAULT_ENDPOINT is missing");
    }

    let response;
    try {
      response = await resolveFetch()(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key_name: name }),
      });
    } catch (error) {
      throw failFast(
        "vault-unreachable",
        name,
        error instanceof Error ? error.message : String(error),
      );
    }
    if (response.status === 401) {
      throw failFast("not-signed-in", name);
    }
    if (response.status === 404 || response.status === 403) {
      throw failFast("key-not-enabled", name);
    }
    if (!response.ok) {
      throw failFast("vault-unreachable", name, `HTTP ${response.status}`);
    }
    const payload = await response.json().catch(() => null);
    const rawValue = payload?.key_value;
    const value =
      payload &&
      payload.ok === true &&
      payload.key_name === name &&
      typeof rawValue === "string" &&
      rawValue.trim().length > 0
        ? rawValue.trim()
        : null;
    if (!value) {
      throw failFast("vault-unreachable", name, "malformed issue response");
    }
    cache.set(name, value);
    logger.log?.(`[vault-supply] pulled "${name}" (cached in process memory)`);
    return value;
  }

  return { requireEnvValue };
}
