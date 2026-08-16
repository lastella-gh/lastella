**Manual Test Setup**

- [ ] Use one admin account: `lackhorse.ak@gmail.com`.
- [ ] Create a separate normal customer account.
- [ ] Open an incognito window for guest testing.
- [ ] Create a test product with price `OMR 10.125`, stock `5`, sizes `S, M`, colors `Gold, Silver`.
- [ ] Upload a main image and at least two gallery images.
- [ ] Keep browser DevTools Console and Network tabs open during testing.

**Storefront**

- [ ] Home page loads without console errors.
- [ ] Products load from Supabase instead of fallback data.
- [ ] Product images, Arabic names, prices, badges, ratings, and stock display correctly.
- [ ] Shop category filters work.
- [ ] Price slider filters products correctly.
- [ ] Price ascending sort works.
- [ ] Price descending sort works.
- [ ] Rating sort works.
- [ ] Hidden products do not appear publicly.
- [ ] Direct product URLs load the correct product.
- [ ] Invalid product URLs show the not-found state.
- [ ] Product gallery thumbnails change the main image.
- [ ] Size and color options work where configured.
- [ ] Out-of-stock products cannot be ordered.

**OMR Currency**

- [ ] Every visible price uses the official Omani rial symbol.
- [ ] Prices display exactly three decimal places.
- [ ] Product cards display the symbol correctly.
- [ ] Product detail prices display correctly.
- [ ] Cart subtotal, shipping, VAT, and total display correctly.
- [ ] Checkout totals display correctly.
- [ ] Account order totals display correctly.
- [ ] Admin product and order totals display correctly.
- [ ] Text-only notifications use `OMR`.
- [ ] No `SAR`, `PKR`, `$`, or generic rial symbol appears.

**Cart And Wishlist**

- [ ] Adding a product updates the cart counter.
- [ ] Adding the same variant increases its quantity.
- [ ] Different sizes or colors create separate cart lines.
- [ ] Increasing and decreasing quantity works.
- [ ] Reducing quantity below one removes the item.
- [ ] Removing an item works.
- [ ] Clearing the cart after checkout works.
- [ ] Cart contents survive a page refresh.
- [ ] Wishlist additions and removals work.
- [ ] Wishlist survives a page refresh.
- [ ] Cart and wishlist remain device-local as intended.

**Shipping And VAT**

- [ ] Orders below or equal to `OMR 20.000` receive `OMR 2.000` shipping.
- [ ] Orders above `OMR 20.000` receive free shipping.
- [ ] VAT equals 5% and rounds to three decimal places.
- [ ] `OMR 10.125` produces VAT of `OMR 0.506`.
- [ ] Displayed checkout totals match the saved admin order totals.
- [ ] Changing browser-side values in DevTools cannot alter database-calculated totals.

**Guest Checkout**

- [ ] Guest checkout works without registration.
- [ ] Required fields prevent empty submission.
- [ ] Invalid email input is rejected.
- [ ] Phone, address, city, country, and notes are saved correctly.
- [ ] Customized gift-box selection is saved correctly.
- [ ] Cash-on-delivery checkout succeeds.
- [ ] Bank-transfer checkout succeeds.
- [ ] A success message shows the generated order number.
- [ ] Success is shown only after Supabase confirms persistence.
- [ ] Guest orders do not appear publicly.
- [ ] Refreshing after checkout does not duplicate the order.

**Authentication**

- [ ] New customer registration succeeds.
- [ ] Email confirmation is not required in development.
- [ ] Registration creates a profile.
- [ ] Registration assigns the `customer` role.
- [ ] Login succeeds with valid credentials.
- [ ] Invalid credentials show an error.
- [ ] Session remains active after refresh.
- [ ] Logout clears the session.
- [ ] A normal customer never receives admin access.
- [ ] Password fields are not stored in localStorage.

**Customer Account**

- [ ] Signed-in checkout associates the order with the customer.
- [ ] The customer’s order appears under “My Orders.”
- [ ] Order number, date, status, and total are correct.
- [ ] A customer cannot see another customer’s orders.
- [ ] Guest orders do not appear in a customer account.
- [ ] A signed-out visitor cannot access customer order history.

**Admin Access**

- [ ] Admin login recognizes `lackhorse.ak@gmail.com` as admin.
- [ ] Admin navigation appears only for the admin.
- [ ] A customer visiting `/admin` receives Access Denied.
- [ ] A signed-out visitor visiting `/admin` is redirected to the account page.
- [ ] Admin dashboard statistics load correctly.
- [ ] Product count is correct.
- [ ] Order count is correct.
- [ ] Revenue total is correct.
- [ ] Pending order count is correct.
- [ ] Recent orders are ordered newest first.

**Admin Products**

- [ ] Admin can create a product.
- [ ] Duplicate slugs are rejected.
- [ ] Negative prices are rejected.
- [ ] Negative stock is rejected.
- [ ] Main image upload succeeds.
- [ ] Gallery uploads succeed.
- [ ] Uploaded images load through Supabase Storage.
- [ ] Product sizes and colors save correctly.
- [ ] Product edits appear publicly.
- [ ] Hiding a product removes it from the storefront.
- [ ] Reactivating a product restores it.
- [ ] Product deletion works.
- [ ] A customer cannot create, edit, hide, or delete products.
- [ ] A customer cannot upload product images.

**Admin Orders**

- [ ] Admin can see guest and customer orders.
- [ ] Order filtering by status works.
- [ ] Customer contact and shipping information are correct.
- [ ] Gift-box status is correct.
- [ ] Order notes are correct.
- [ ] Product names, images, variants, quantities, and unit prices are correct.
- [ ] Subtotal, shipping, VAT, and total are correct.
- [ ] Status can move through pending, processing, shipped, delivered, and cancelled.
- [ ] Updated status appears in the customer account.
- [ ] A normal customer cannot update order status.

**Inventory Protection**

- [ ] Successful checkout reduces stock by the ordered quantity.
- [ ] Multiple cart variants deduct their combined quantity.
- [ ] Attempting to order more than available stock fails.
- [ ] A failed stock check creates no order.
- [ ] A failed stock check creates no order items.
- [ ] A failed checkout does not reduce stock.
- [ ] Two rapid checkout attempts cannot make stock negative.
- [ ] Inactive products cannot be checked out.

**Security Checks**

- [ ] No MongoDB requests appear in the Network panel.
- [ ] No `/api/products`, `/api/orders`, or `/api/order-items` requests appear.
- [ ] No service-role key appears in browser source or Network requests.
- [ ] Only the Supabase publishable key is present in the browser.
- [ ] `localStorage` contains no `mock_user`.
- [ ] `localStorage` contains no `lastella-orders`.
- [ ] Anonymous order-table requests return no rows.
- [ ] Customer product mutations are rejected by Supabase.
- [ ] Customer order-status mutations are rejected.
- [ ] Directly changing the URL cannot bypass admin authorization.

**Language And Layout**

- [ ] English language toggle works.
- [ ] Arabic language toggle works.
- [ ] RTL layout renders correctly.
- [ ] OMR symbol alignment works in both LTR and RTL.
- [ ] Desktop layout works at 1440px width.
- [ ] Tablet layout works around 768px width.
- [ ] Mobile layout works around 390px width.
- [ ] Navigation menu works on mobile.
- [ ] Cart and checkout forms fit without horizontal scrolling.
- [ ] Admin tables remain usable on mobile.

**Accessibility**

- [ ] The complete site can be navigated with a keyboard.
- [ ] Focus indicators are visible.
- [ ] Form fields have accessible names.
- [ ] Images have appropriate alternative text.
- [ ] Buttons have understandable labels.
- [ ] Currency values announce `OMR` to screen readers.
- [ ] Errors are visible and understandable.
- [ ] Text remains readable at 200% browser zoom.

**Production Deployment**

- [ ] `VITE_SUPABASE_URL` is configured in the deployment environment.
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is configured.
- [ ] No service-role or database password is configured in frontend variables.
- [ ] Production site URL is added to Supabase Auth URL settings.
- [ ] Leaked-password protection is enabled if available.
- [ ] Old MongoDB credentials have been rotated.
- [ ] Supabase database password has been rotated.
- [ ] Production build completes successfully.
- [ ] A final guest checkout works on the deployed URL.
- [ ] A final customer checkout works on the deployed URL.
- [ ] A final admin login and status update work.

**Cleanup**

- [ ] Delete temporary test products.
- [ ] Remove test Storage images.
- [ ] Delete temporary customer accounts.
- [ ] Cancel or clearly label test orders.
- [ ] Restore stock changed by testing.
- [ ] Confirm dashboard totals exclude or identify test data.
