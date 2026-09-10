const { randomUUID } = require("node:crypto");
const path = require("node:path");
const { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

class StorageError extends Error {
  constructor(code, message, statusCode = 503) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

function configuration(env) {
  const required = ["B2_ENDPOINT", "B2_REGION", "B2_BUCKET_NAME", "B2_KEY_ID", "B2_APPLICATION_KEY"];
  const missing = required.filter((key) => !env[key]?.trim());
  if (missing.length) throw new StorageError("STORAGE_NOT_CONFIGURED", `File storage is not configured: ${missing.join(", ")}`);
  try {
    const endpoint = new URL(env.B2_ENDPOINT);
    const publicBase = new URL(env.B2_PUBLIC_BASE_URL || `${endpoint.origin}/${env.B2_BUCKET_NAME}`);
    if (endpoint.protocol !== "https:" || publicBase.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== "/" || publicBase.username || publicBase.password || publicBase.search || publicBase.hash || !/^[a-zA-Z0-9-]+$/.test(env.B2_BUCKET_NAME) || endpoint.hostname !== `s3.${env.B2_REGION}.backblazeb2.com`) throw new Error();
    return { endpoint: endpoint.origin, region: env.B2_REGION, bucket: env.B2_BUCKET_NAME, publicBase: publicBase.href.replace(/\/+$/, ""), credentials: { accessKeyId: env.B2_KEY_ID, secretAccessKey: env.B2_APPLICATION_KEY } };
  } catch {
    throw new StorageError("STORAGE_NOT_CONFIGURED", "B2 endpoint and public base URL must be valid HTTPS URLs.");
  }
}

function createObjectStorage({ env = process.env, makeClient = (options) => new S3Client(options), logger = console } = {}) {
  let client;
  let config;
  const connect = () => {
    if (!client) {
      config = configuration(env);
      client = makeClient({ endpoint: config.endpoint, region: config.region, credentials: config.credentials, forcePathStyle: true, maxAttempts: 2, requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" });
    }
    return { client, config };
  };
  const keyFromUrl = (value) => {
    if (typeof value !== "string") return null;
    // Missing configuration must not prevent editing records with legacy images.
    if (!env.B2_ENDPOINT || !env.B2_BUCKET_NAME) return null;
    try {
      const base = new URL(env.B2_PUBLIC_BASE_URL || `${new URL(env.B2_ENDPOINT).origin}/${env.B2_BUCKET_NAME}`);
      const url = new URL(value);
      const prefix = `${base.pathname.replace(/\/+$/, "")}/`;
      if (url.origin !== base.origin || url.username || url.password || !url.pathname.startsWith(prefix)) return null;
      const key = decodeURIComponent(url.pathname.slice(prefix.length));
      if (!key || key.split("/").some((part) => !part || part === "." || part === "..") || key.includes("\\")) return null;
      return key;
    } catch { return null; }
  };
  return {
    keyFromUrl,
    async upload(file, prefix) {
      if (!file || !Buffer.isBuffer(file.buffer) || !/^[a-zA-Z0-9_-]+$/.test(prefix)) throw new StorageError("INVALID_UPLOAD", "Invalid upload data.", 400);
      const { client, config } = connect();
      const ext = path.extname(file.originalname || "").toLowerCase();
      const key = `${prefix}/${randomUUID()}${/^\.[a-z0-9]{1,10}$/.test(ext) ? ext : ""}`;
      try {
        const result = await client.send(new PutObjectCommand({ Bucket: config.bucket, Key: key, Body: file.buffer, ContentType: file.mimetype || "application/octet-stream", ContentLength: file.buffer.length }), { abortSignal: AbortSignal.timeout(30000) });
        return { key, versionId: result.VersionId, url: `${config.publicBase}/${key.split("/").map(encodeURIComponent).join("/")}` };
      } catch (error) {
        logger.error("B2 upload failed", { key, code: error.name, status: error.$metadata?.httpStatusCode });
        throw new StorageError("STORAGE_UNAVAILABLE", "File storage is unavailable. Please try again or contact the administrator.");
      }
    },
    async remove(file) {
      const url = typeof file === "string" ? file : file?.url;
      const key = keyFromUrl(url);
      if (!key) return;
      const { client, config } = connect();
      try {
        const versionId = typeof file === "object" && file.versionId || (await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }), { abortSignal: AbortSignal.timeout(30000) })).VersionId;
        if (!versionId) throw new Error("MissingObjectVersion");
        await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key, VersionId: versionId }), { abortSignal: AbortSignal.timeout(30000) });
      } catch (error) {
        if (error.$metadata?.httpStatusCode === 404 || ["NotFound", "NoSuchKey"].includes(error.name)) return;
        throw error;
      }
    },
    async cleanup(files) {
      for (const file of files) {
        try { await this.remove(file); }
        catch (error) { logger.error("B2 cleanup failed; retry cleanup for this key", { key: this.keyFromUrl(typeof file === "string" ? file : file.url), code: error.name }); }
      }
    },
  };
}

module.exports = { createObjectStorage, StorageError, configuration, objectStorage: createObjectStorage() };
