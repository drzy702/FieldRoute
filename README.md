# CS465
Full Stack Web Application Course

## Running locally

Start MongoDB, then run `npm start` in the project root for the customer website
and API at `http://localhost:3000`. Run `npm start` in `app_admin` for the admin
application at `http://localhost:4200`.

## Admin application

Admin accounts land on a dashboard with trip and user totals, plus tabs for
Available Trips, Users, Rooms, Meals, News, and About. Trips retain their add,
edit, delete, search, filter, and pagination controls. Cards use uniform heights,
cropped images, and scrollable descriptions so the action buttons stay aligned.

The Users tab is a searchable directory of names, emails, and roles. Password
hashes and salts are excluded from the API response. Admin routes and trip
changes require an account whose existing `role` is `admin`; newly registered
accounts remain customers. Admin accounts can still sign in to the customer site.
Sign in again after a role change to obtain an updated session.

The four page editors update existing text and select photos from the site's image
library. Changes save to the MongoDB `pages` collection and appear when the
customer page is loaded or refreshed. The original HTML remains as a fallback.
`data/site-pages.json` maps the editable fields to the existing page elements;
update those selectors if the public page markup is reorganized.

## Validation

- API access, field validation, and content mapping tests: `node --test test/admin-api.test.js`
- Production admin build: `cd app_admin` then `npm run build`
