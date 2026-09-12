const LINE_ID_TOKEN_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

class LineIdentityError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "LineIdentityError";
    this.code = code;
    this.status = status;
  }
}

const invalidToken = () =>
  new LineIdentityError(
    "LINE_ID_TOKEN_INVALID",
    "LINE identity token is invalid",
    401
  );

const identityUnavailable = () =>
  new LineIdentityError(
    "LINE_IDENTITY_UNAVAILABLE",
    "LINE identity verification is unavailable",
    503
  );

const createLineIdentityVerifier = ({
  channelId = process.env.LINE_LOGIN_CHANNEL_ID,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
} = {}) => {
  return async (idToken) => {
    if (!channelId) {
      throw new LineIdentityError(
        "LINE_IDENTITY_NOT_CONFIGURED",
        "LINE identity verification is not configured",
        503
      );
    }
    if (typeof fetchImpl !== "function") {
      throw identityUnavailable();
    }

    let response;
    try {
      response = await fetchImpl(LINE_ID_TOKEN_VERIFY_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
      });
    } catch (_error) {
      throw identityUnavailable();
    }

    let payload;
    try {
      payload = await response.json();
    } catch (_error) {
      if (!response.ok) throw invalidToken();
      throw identityUnavailable();
    }

    const expiresAt = Number(payload.exp) * 1000;
    if (
      !response.ok ||
      typeof payload.sub !== "string" ||
      payload.sub.length === 0 ||
      String(payload.aud) !== String(channelId) ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= now()
    ) {
      throw invalidToken();
    }

    return {
      subject: payload.sub,
      displayName:
        typeof payload.name === "string" && payload.name.trim()
          ? payload.name.trim()
          : null,
    };
  };
};

const verifyLineIdToken = (idToken) =>
  createLineIdentityVerifier()(idToken);

module.exports = {
  LineIdentityError,
  createLineIdentityVerifier,
  verifyLineIdToken,
};
