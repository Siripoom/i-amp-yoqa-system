# Backblaze B2 storage

All former Supabase uploads now use the B2 S3-compatible API. The existing bucket
must allow public downloads, including order payment slips, matching the chosen
access policy. The backend handles uploads; credentials never go to the browser.

## Configuration

Copy the B2 entries from `.env.example` into the backend `.env` (local) and the
backend hosting environment (deployment):

- `B2_ENDPOINT`: the HTTPS S3 endpoint displayed in the bucket details, without a bucket path.
- `B2_REGION`: the region in that endpoint.
- `B2_BUCKET_NAME`: the existing public bucket name.
- `B2_KEY_ID`, `B2_APPLICATION_KEY`: a B2 Application Key authorized for that bucket with read, write and delete access. The S3 API does not support the master Application Key.
- `B2_PUBLIC_BASE_URL`: optional public bucket/CDN base URL. Include the bucket path if required by that download endpoint. Defaults to `B2_ENDPOINT/B2_BUCKET_NAME`.

Restart the backend after changing `.env`. No frontend storage credentials or
environment changes are needed. Missing B2 configuration does not prevent the
server from starting or reading MongoDB; file uploads return HTTP 503 with
`STORAGE_NOT_CONFIGURED`. Provider errors return `STORAGE_UNAVAILABLE` without
exposing credentials. Backend logs include the operation key and error code.

Installation uses `yarn install --immutable` in Docker. For npm installations,
use `npm ci --legacy-peer-deps`: the repository's existing `multer-gridfs-storage`
peer range does not match the installed Multer LTS version.

## Verification

```sh
npm test
npm run storage:check
npm run storage:smoke
```

`npm test` exercises storage failures and all eight controllers using real
Mongoose validation with isolated in-memory persistence and storage doubles.
It does not connect to MongoDB or B2.

`storage:check` is read-only. `storage:smoke` uploads two synthetic PNGs under
`diagnostics/`, downloads them anonymously and compares their bytes, then deletes
their exact versions and checks that their URLs return 404. Neither command
creates database records. If cleanup fails, the command exits unsuccessfully
and prints only the object key for manual cleanup. A CDN may require purge or
appropriate cache settings before deletion becomes visible.

After smoke verification, test the QR uploader in Image Setup: create, display,
replace, reload, and delete a disposable QR record. Test Orders against isolated
test data because creating an order also creates business records.

## File lifecycle and compatibility

Prefixes are `payment_qrcodes`, `heroImages`, `slider_images`, `masters`, `class`,
`products`, `goods` and `orders`. New keys use UUIDs and preserve file MIME type.
API routes and `image` URL fields are unchanged; Goods still uses multipart
`images` with at most three files and stores an array of URLs.

Replacement uploads and MongoDB saves finish before old objects are removed.
Failed writes clean up newly uploaded objects; metadata-only edits do not delete
images. Soft deletion retains files. Cleanup after a successful database write
is best effort: failures are logged with the key for retry and do not undo the
successful database operation. B2 cleanup resolves and deletes the specific
object version rather than adding a delete marker. Unexpected process termination
or an indeterminate network failure can still leave an orphan object; this is
not a distributed transaction or a durable cleanup queue.

Cleanup accepts only URLs belonging to the configured public base and bucket.
Existing Supabase/third-party URLs are left unchanged and never mapped to B2
keys. No old file migration is performed, so unavailable legacy files remain
unavailable until re-uploaded. Keep the public base stable after launch; changing
it requires planning a URL migration. MongoDB connection and business-data
filters are unchanged.

References: [Backblaze AWS SDK v3](https://www.backblaze.com/docs/cloud-storage-use-the-aws-sdk-for-javascript-v3-with-backblaze-b2),
[Application Keys](https://www.backblaze.com/docs/cloud-storage-s3-compatible-app-keys),
[version-specific deletion](https://www.backblaze.com/apidocs/s3-delete-object).
