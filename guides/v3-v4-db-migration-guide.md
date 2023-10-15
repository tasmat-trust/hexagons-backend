# Database migration guide

Use the [Strapi migration scripts](https://github.com/strapi/migration-scripts). N.B. there is a branch in a fork of the repo that successfully imports many-to-many relations. See the PR here and if it hasn't been merged, use that fork: https://github.com/strapi/migration-scripts/pull/100

Setup two new local databases using PGAdmin. One named [school]-v3 and the other [shool]-v4. Configure this project to point to the version 4 database in .env and run the server using `yarn develop` to populate the db skeleton.

Visit Render to take a download of the latest backup, and extract it as an SQL file.

Import the SQL export into the new local DB:

`psql -U strapi_j8xu_user -W [school]-v3 < ./[school]-db.sql`

Copy the following as .env into the root of the v3-v4-sql migration folder:

```
# General Settings
DATABASE_CLIENT=pg
BATCH_SIZE=50

# V3 Settings
DATABASE_V3_HOST=127.0.0.1
DATABASE_V3_PORT=5432
DATABASE_V3_USER=strapi_j8xu_user
DATABASE_V3_PASSWORD=password
DATABASE_V3_DATABASE=tasmat-v3
DATABASE_V3_SCHEMA=public

# V4 Settings
DATABASE_V4_HOST=127.0.0.1
DATABASE_V4_PORT=5432
DATABASE_V4_USER=strapi_j8xu_user
DATABASE_V4_PASSWORD=password
DATABASE_V4_DATABASE=tasmat-v4
DATABASE_V4_SCHEMA=public
```

Run the migration script

## Reminder to update roles

The role permission will need updating: http://localhost:1337/admin/settings/users-permissions/roles/1

## Deploying changes

N.B. we have updated to use yarn so the Render setting will need updating.

Update ENVs