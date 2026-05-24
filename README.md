# Meesho Pick & Pack

Production-ready foundation for a small ecommerce seller's daily Meesho warehouse workflow.

The app supports the daily local warehouse flow:

- Owner uploads Meesho label and/or supplier manifest PDFs for parser review.
- The parser extracts AWB, courier, SKU, quantity, color, size, order number, product description, payment type, and related invoice fields where available.
- Owner maps SKU to a Meesho product image URL. Product files are not stored.
- Picker sees SKU-grouped mobile-first product cards.
- Packer searches/scans AWB, verifies order details, confirms packed, or marks a problem order.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite for local development
- PostgreSQL-ready schema for future Supabase
- Zod validation
- Server actions
- PWA-ready manifest and icon

## Setup

Create `.env` from the example:

```bash
cp .env.example .env
```

Install dependencies:

```bash
npm install
```

Create the local SQLite database:

```bash
npx prisma migrate dev
```

Seed sample data:

```bash
npm run db:seed
```

Start the app:

```bash
npm run dev -- --host 0.0.0.0
```

Open locally:

```text
http://localhost:3000
```

## Mobile Testing On The Same Wi-Fi

1. Keep the dev server running with `npm run dev -- --host 0.0.0.0`.
2. Find your PC's local IP address.
   - Windows: run `ipconfig` and use the IPv4 address for your Wi-Fi adapter.
   - Example: `192.168.1.25`.
3. On your phone, open:

```text
http://192.168.1.25:3000
```

Your phone and PC must be on the same network. If Windows Firewall prompts for Node.js, allow private network access.

## Safe Local Usage

Run the app only on the shop/office PC. Workers should use the browser URL from their phones or desktops:

```text
http://YOUR_PC_IP:3000
```

Workers do not need the codebase, VS Code, terminal, Prisma, or npm. Keep those on the owner PC only.

## Same Wi-Fi Security

Every app page except the login screen requires an active login. Use strong passwords, keep the owner password private,
and deactivate worker users from **Owner -> Users** if an unknown phone or browser appears.

**Owner -> Users** is intentionally limited to session review and deactivation. User creation and password changes are
planned for a later sprint.

Optional local network protection:

```env
LOCAL_NETWORK_ONLY=true
ALLOWED_IP_RANGES="192.168.0.0/16,10.0.0.0/8,172.16.0.0/12"
```

Localhost is always allowed for owner testing on the PC. The app also reads `x-forwarded-for` / `x-real-ip` so it can
work behind a reverse proxy later.

## Seed Login

All seed users use password `demo1234`.

| Username | Role |
| --- | --- |
| `owner` | OWNER |
| `picker` | PICKER |
| `packer` | PACKER |

Seed account and order:

| Field | Value |
| --- | --- |
| Account | Sullery |
| AWB | 1490834915493571 |
| Courier | Delhivery |
| SKU | 1202919298_6 |
| Qty | 1 |
| Color | Silver |
| Order No | 290010756104090432_1 |
| Product | Sports Jersey Number Personalized Pendant |
| Image URL | https://images-r.meesho.com/images/products/576264463/z71on.avif |

## SKU Image Import

Owners can import persistent SKU-to-image mappings from:

```text
/owner/sku-mappings/import
```

CSV or `.xlsx` columns:

```csv
sku,image_url,product_name,notes
1202919298_6,https://images-r.meesho.com/images/products/576264463/z71on.avif,Sports Jersey Number Personalized Pendant,Seed mapping
```

Required columns:

- `sku`
- `image_url`

Optional columns:

- `account`
- `product_name`
- `notes`
- `active`

Common alternate names are accepted, including `SKU`, `sku_code`, `supplier_sku`, `image`, `imageUrl`,
`meesho_image_url`, `product_image_url`, `name`, `product_title`, and `account_name`.

Existing mappings are upserted by `accountId + sku`. Same URL/data is counted as unchanged; changed rows update the
stored URL and metadata. Product image files are never stored.

## Supported Meesho PDFs

The owner upload page supports text-based Meesho seller PDFs:

- Meesho Sub Order Labels, usually named `Sub_Order_Labels_*.pdf`
- Meesho Supplier Manifest / Picklist, usually named `Supplier_Manifest_*.pdf`

Upload a label PDF, a manifest/picklist PDF, or both. The app parses the file on the server, stores review rows, and
does not persist the original PDF.

## Parser Design

Sprint 2 uses server-side text extraction and layout-tolerant reconstruction:

- PDF text is extracted page by page with an open-source Node parser.
- Label pages are anchored around invoice, AWB, courier, and Product Details text.
- Manifest courier tables are reconstructed from line groups so wrapped sub order numbers and wrapped SKUs can be fixed.
- Hidden/control separators in SKUs are normalized, for example `SUL-PN-BC-SS-BL...Allah40` becomes `SUL-PN-BC-SS-BL-Allah40`.
- Each parsed row gets a confidence score and issue badges.
- Rows with missing AWB or SKU are held for review and are not imported as normal orders.
- Uploading both labels and manifest enables cross-checks for missing AWBs, SKU mismatches, quantity mismatches, courier warnings, and picklist total mismatches.

OCR for scanned or image-only PDFs is planned for a later sprint. If parser confidence is low, the owner should review
the row before confirming import.

## Daily Workflow

1. Upload label PDF and/or manifest PDF from **Owner -> Upload labels**.
2. Review parsed rows, confidence, duplicates, missing AWBs/SKUs, missing image mappings, and cross-check issues.
3. Fix missing SKU image mappings when needed.
4. Confirm import. Orders flow through the duplicate-safe `accountId + AWB` importer.
5. Workers pick by SKU and pack by AWB from their phone browsers on the same Wi-Fi.

## Duplicate Protection

Orders are protected by the unique key `accountId + awb`. Re-uploading old + new Meesho picklist/label files will not
duplicate work:

- Missing AWB rows are rejected.
- Existing AWBs are skipped when unchanged.
- Existing AWBs can update safe fields such as courier, order number, SKU, quantity, color, and product description.
- Batch review pages show created, updated, duplicate, skipped, and error counts.

## Image Handling

Only image URLs are stored. Images are loaded directly from their source URL in the browser; the app does not proxy,
download, or store image files.

If an image URL is missing or fails in the browser, product cards show a clean fallback with a "Check URL" prompt. Broken
mapping health is recorded for owner reports when the browser detects a load failure.

## Useful Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test:validators
npm run validate
npm run db:seed
```

## Database Notes

Local development uses `prisma/schema.prisma` with SQLite:

```env
DATABASE_URL="file:./dev.db"
```

For future Supabase/PostgreSQL work, use the mirrored PostgreSQL schema:

```bash
npx prisma migrate dev --schema prisma/schema.postgres.prisma
```

Then set `DATABASE_URL` to the Supabase PostgreSQL connection string.

## Privacy And Data Handling

- The foundation stores only operational order fields needed for picking and packing.
- Product image files are not stored. Only `imageUrl` is stored for SKU mapping.
- Customer personal data is intentionally minimal. City/state are optional parser outputs.
- Upload actions do not persist raw PDF files.
- The app does not scrape Meesho.

## Future Scanner Hooks

- Add a browser barcode scanner to `/packing` and submit scanned AWBs through `searchAwbAction`.
