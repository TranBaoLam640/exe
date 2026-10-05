# Return and deposit refund evidence

Configure these environment variables on the **backend** service:

```text
R2_ACCOUNT_ID=<Cloudflare account ID>
R2_ACCESS_KEY_ID=<R2 S3 access key>
R2_SECRET_ACCESS_KEY=<R2 S3 secret>
R2_EVIDENCE_BUCKET=<private evidence bucket name>
```

Use a private R2 bucket with Object Read & Write credentials scoped to that
bucket. Disable public access and do not attach a public custom domain. Return
photos and bank transfer screenshots must not go into the public catalog asset
bucket. No browser R2 credentials or bucket CORS configuration are required:
the authenticated backend uploads and reads objects through the S3 API.
ASP.NET Core reads environment variables directly; a repository `.env` file is
not automatically loaded by the API.

Apply the `AddEvidencePhotos` EF Core migration before deploying the API:

```powershell
dotnet ef database update --project backend/DoRentMe.Api
```

The migration only creates `EvidencePhotos` and its indexes/foreign keys.
The deployment migration bundle also includes this migration.

Customer flow:

1. `POST /api/orders/{orderId}/return-photos` with multipart field `file`.
2. Upload 2–10 different JPEG, PNG or WebP photos, each at most 5 MB.
3. `POST /api/orders/{orderId}/request-return` with `{ "photoIds": ["..."] }`.

Admin flow:

1. Complete the existing return inspection and create the deposit settlement.
2. Transfer the refundable deposit using the existing manual refund process.
3. `POST /api/admin/refunds/{refundId}/proof-photos` with multipart field `file`.
4. `PUT /api/admin/refunds/{refundId}/status` with
   `{ "status": "completed", "transactionCode": "...", "photoIds": ["..."] }`.

At least one proof photo is required when completing a deposit refund.
Cancellation refunds keep their existing behavior. Existing completed refunds
remain readable without retrospective proof requirements.

Order responses expose `returnPhotoIds`; refund responses expose
`proofPhotoIds`. `GET /api/evidence/{photoId}` serves the original image with
authentication and `private, no-store` caching. Only the order customer and
admins can read attached photos. Unattached uploads are visible only to the
uploader within those roles. Object keys and credentials are never returned.
Identical bytes uploaded again are reused; duplicate IDs cannot satisfy the
minimum photo requirement. Uploads are saved before submission, so failed
submissions can be retried without uploading the same images again.

Objects belonging to abandoned uploads are retained; automatic cleanup is not
part of this feature. Test storage is in memory and does not contact R2.

References: [R2 S3 authentication](https://developers.cloudflare.com/r2/api/tokens/)
and [AWS Signature V4](https://docs.aws.amazon.com/AmazonS3/latest/developerguide/sig-v4-header-based-auth.html).
