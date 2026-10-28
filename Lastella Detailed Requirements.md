# Lastella Detailed Requirements

This document is the implementation specification derived from the client discussion. The original `Lastella Requirements.md` is retained unchanged as the source notes.

## 1. Catalog and Pricing

- New products default to OMR 1.100, with three decimal places.
- Administrators may edit product and box prices.
- Checkout always reloads current database prices and never trusts browser-supplied prices.
- Jewelry categories are Necklace, Bracelet, Bangle, Anklet, Ring, Earrings, Pendant, and Watch.
- Gift Sets is not a category.
- Every product belongs to one managed brand. Existing jewelry initially belongs to a temporary Lastella brand.
- Category pages provide All and brand filters. All includes every visible product in that category.
- New Arrivals and Combos are independent, admin-controlled collections. A product may appear in both.
- Brand Boxes shows visible Ring Box and General Box products with brand filtering.

## 2. Availability and Visibility

- Product availability is a manual Available/Unavailable toggle; numeric stock is not used.
- Product visibility is a separate Visible/Hidden toggle.
- Unavailable products remain visible but cannot be added to the cart or purchased.
- Hidden products do not appear in listings, search, recommendations, or public product pages.
- Size/color combinations are managed as product variants, each with its own availability toggle.
- Orders do not automatically change product or variant availability.
- Checkout revalidates product visibility, product availability, and selected variant availability.

## 3. Brands

The initial packaging brands are:

- Cartier
- Dior
- Hermès
- Chanel
- Van Cleef & Arpels
- Louis Vuitton
- Bvlgari
- APM Monaco
- Messika
- Swarovski
- Aigner
- Valentino

Tiffany & Co., Gucci, and Rolex are excluded until matching assets are supplied. Administrators can create, edit, show, or hide brands.

## 4. Matching Rings

- Selecting a color on a non-ring product suggests visible and available rings with an available variant in the same color.
- Suggestions link to the ring product page and never add a ring automatically.
- Customers must select a valid ring size and other required options before adding it.
- The section is hidden when no matching ring exists.

## 5. Box Products

- Ring boxes and general boxes are separate products.
- One brand/type combination is one product with a normal product page and image gallery.
- Box color is a fixed descriptive brand attribute, not a selectable customer variant, until supplier data confirms real color variants.
- Box products default to OMR 1.100 and remain admin-editable.
- Only box types clearly represented by supplied images are created.
- Box products have the same visibility and availability controls as jewelry.
- Boxes are excluded from normal jewelry category navigation.

### Checkout Suggestions

- A cart containing rings shows all visible and available Ring Box products.
- A cart containing non-ring jewelry shows all visible and available General Box products.
- A mixed cart displays separate Ring Boxes and General Boxes sections.
- Each suggestion links to the box product page; checkout does not add a box directly.
- A box already in the cart is not suggested again.

## 6. Delivery

- Delivery starts unselected and is required before checkout submission.
- Home Delivery means delivery to the customer's residential address and costs OMR 2.000.
- Office Delivery means delivery to the customer's workplace address and costs OMR 1.000.
- Delivery fees apply to every order; there is no free-shipping threshold.
- The selected delivery type and authoritative delivery fee are stored on the order.

## 7. Tax and Totals

- New orders have OMR 0.000 tax.
- VAT is not displayed or charged.
- Total equals product and box subtotal plus delivery.
- Historical orders retain their recorded shipping, tax, and total values.

## 8. Payment and Order Status

- Bank transfer is the only payment method for new orders.
- Cash on Delivery is removed from checkout and current storefront messaging.
- Checkout displays bank details and instructions. Placeholder values are used until the client supplies final details.
- Customers must upload a JPG, PNG, or WEBP payment screenshot of at most 5 MB before checkout submission.
- Payment screenshots are private. Customers cannot list or download them, and administrators receive only short-lived authorized access.
- New orders begin with the general order status Awaiting Payment.
- New orders with a screenshot begin with payment status Proof Submitted.
- Administrators verify or reject payment proof. Rejections require a reason.
- A proof-bearing order cannot move to Processing until payment is verified.
- Historical payment methods and statuses remain unchanged.

### Confirmation and Notifications

- Guest and signed-in customers receive a secure order-success page through an opaque, unguessable reference.
- The success page exposes only limited order details and masks contact information; it never exposes the delivery address or payment screenshot.
- A successful order sends a confirmation email to the customer and a new-order email to configured site administrators.
- Email-provider failures do not roll back an order that has already been committed.

## 9. Homepage Video

- The homepage includes an admin-managed promotional video URL and enabled/disabled control.
- Bank instruction placeholders and homepage video settings are editable from the admin panel.
- On laptop and desktop screens the video section occupies approximately 80% of the viewport height.
- The video remains responsive on tablets and phones without horizontal overflow.
- Playback is muted, looping, autoplaying, and inline where browsers permit it.
- An optional poster image or graceful fallback is shown when playback is unavailable.
- An invalid or missing video URL must not break the homepage.

## 10. Administration

- Products: manage names, slug, brand, category/type, prices, badge, New Arrival and Combo collection membership, descriptions, visibility, availability, variants, and image galleries.
- Brands: create, edit, show, hide, and inspect product usage.
- Orders: inspect delivery type, delivery fee, bank payment method, private payment proof, box line items, totals, payment review, and general order status.
- Store settings: manage homepage video, poster, bank details, and transfer instructions.
- Product and settings writes remain admin-only through database RLS.

## 11. Security and Validation

- Public users can read only visible storefront records.
- Hidden products cannot be purchased through stale carts or direct requests.
- The TanStack server checkout function performs input validation and authoritative calculations.
- The service-only database commit function retains row locking and atomic order/item writes.
- Anonymous and authenticated browser roles cannot call the commit function directly.
- Product, variant, delivery, payment, and price state is revalidated immediately before order creation.
- Payment proofs use one-time signed uploads to a private bucket and are linked atomically when the order is committed.
- Guest confirmation references are stored only as SHA-256 hashes.

## 12. Acceptance Criteria

- Admin can manage brands, products, variants, box products, order statuses, and storefront settings.
- Hidden and unavailable states behave independently.
- Category All and brand filters return the correct products.
- Matching ring suggestions use an actually available matching color.
- Ring-only, non-ring, and mixed carts show the correct box groups.
- Home adds OMR 2.000; Office adds OMR 1.000; tax remains zero.
- Only bank transfer is accepted and new orders start Awaiting Payment.
- Payment proof is mandatory, remains private, and must be verified before Processing.
- Guest checkout ends on a secure success page with masked contact information.
- Customer and administrator order emails are sent when transactional email variables are configured.
- Numeric stock is not decremented.
- Box and normal product images upload through Supabase Storage under admin-only mutation policies.
- The homepage video is approximately 80 viewport-height units on desktop and usable on mobile/tablet.
