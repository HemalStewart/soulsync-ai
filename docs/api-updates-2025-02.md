# chatsoul-ai API Updates (February 2025)

This addendum captures the latest API and product changes so you can keep Postman collections, customer support macros, and partner documentation in sync without re-exporting the entire specification.

## Generated Image Reporting

- **Endpoint:** `POST /api/generated-images/{imageId}/report`
- **Purpose:** Allows an authenticated user to flag one of their generated images for review.
- **Body fields:**
  - `reason` (required): one of `sexual_content`, `violent_content`, `hate_speech`, `self_harm`, `spam`, or `other`.
  - `details` (optional): free-form context (400 characters max in the UI).
- **Behaviour:** If the user has already reported the image, the endpoint returns a success message without duplicating the record.
- **Storage:** Reports are persisted in the new `generated_image_reports` table (see migration `2025-02-20-000000_CreateGeneratedImageReportsTable.php`).

## Coin Pricing Adjustments

- **Image generation:** now deducts **25** coins (was 5).
- **Video generation:** now deducts **75** coins (was 25).
- These amounts are codified in `backend/app/Libraries/CoinManager.php` and mirrored on the frontend via `frontend/lib/coins.ts`. Update pricing copy in marketing assets and onboarding flows if necessary.

## Postman Collection

- Added the **“Report Generated Image”** request under the **Generated Images** folder with a sample payload.
- Noted the new coin costs in the descriptions for “Create Generated Image Entry” and “Create Generated Video Entry”.
- Re-export or sync the updated collection (`postman/chatsoul-ai.postman_collection.json`) if you share it externally.

## Error Messaging

- When the Venice image API blocks a prompt for safety reasons, the frontend bridge now returns a friendlier message:  
  _“We could not generate that image because the prompt may violate our community guidelines. Try adjusting the description to keep it friendly.”_
- If you localise or template errors, add this copy to the catalogue.

---

_Last updated: 20 Feb 2025_
