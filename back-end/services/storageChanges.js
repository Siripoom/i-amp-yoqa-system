const { objectStorage, StorageError } = require("./objectStorage");

// One instance per request. Mark committed immediately after the owning record is saved.
class StorageChanges {
  constructor(storage = objectStorage) {
    this.storage = storage;
    this.uploaded = [];
    this.obsolete = [];
    this.committed = false;
  }
  async upload(file, prefix, oldUrl) {
    const uploaded = await this.storage.upload(file, prefix);
    this.uploaded.push(uploaded);
    if (oldUrl && oldUrl !== uploaded.url) this.removeAfterCommit(oldUrl);
    return uploaded.url;
  }
  async uploadMany(files, prefix, oldUrls = []) {
    // Sequential uploads make partial-failure rollback deterministic.
    const urls = [];
    for (const file of files) urls.push(await this.upload(file, prefix));
    this.removeAfterCommit(oldUrls);
    return urls;
  }
  removeAfterCommit(urls) {
    this.obsolete.push(...(Array.isArray(urls) ? urls : [urls]).filter(Boolean));
  }
  commit() { this.committed = true; }
  async finish() {
    await this.storage.cleanup(this.committed ? [...new Set(this.obsolete)] : this.uploaded);
    this.uploaded = [];
    this.obsolete = [];
  }
}

function respondStorageError(res, error) {
  if (!(error instanceof StorageError)) return false;
  res.status(error.statusCode).json({ status: "error", code: error.code, message: error.message });
  return true;
}

module.exports = { StorageChanges, respondStorageError };
