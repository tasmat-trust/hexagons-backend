# Database migration guide

## 1. Create new database in Render

Go to the blueprint in Render backend and accept the creation of the new strapi-v4 database.

Trigger a fresh backup of the existing database.

In your local system, start a session with `psql -U postgres`

Create a new local postgres user with the same credentials as the user associated with the newly-provisioned database:

`CREATE ROLE [username] WITH LOGIN PASSWORD '[password]' SUPERUSER;`

## 2. Migrate data locally

Setup two new local databases using PGAdmin. One named [school]-v3-[db-user] and the other [school]-v4-[db-user]. 

### Prepare old DB

Go back to Render to download the latest backup, and extract it as an SQL file.

Import the SQL export into the new local DB, where the username is the same as the new strapi-v4 database:

`psql -U strapi_j8xu_user -W [school]-v3 < ./[school]-db.sql`

### Prepare new DB

Configure this project to point to the version 4 database in .env and run the server using `yarn develop` to populate the db skeleton.

### Run the migration script


Use the [Strapi migration scripts](https://github.com/strapi/migration-scripts). N.B. there is a branch in a fork of the repo that successfully imports many-to-many relations. See the PR here and if it hasn't been merged, use that fork: https://github.com/strapi/migration-scripts/pull/100

Copy the following as .env into the root of the v3-v4-sql migration folder:

```
# General Settings
DATABASE_CLIENT=pg
BATCH_SIZE=50

# V3 Settings
DATABASE_V3_HOST=127.0.0.1
DATABASE_V3_PORT=5432
DATABASE_V3_USER=[db_user]
DATABASE_V3_PASSWORD=[password]
DATABASE_V3_DATABASE=[v3-db-name]
DATABASE_V3_SCHEMA=public
DATABASE_SSL=false

# V4 Settings
DATABASE_V4_HOST=127.0.0.1
DATABASE_V4_PORT=5432
DATABASE_V4_USER=[db_user]
DATABASE_V4_PASSWORD=[password]
DATABASE_V4_DATABASE=[v4-db-name]
DATABASE_V4_SCHEMA=public
DATABASE_SSL=false
```

Run the migration script with `yarn start`

## Restore new Render DB with migrated DB

Connect to the Render DB in pgAdmin 4.  

Download a backup of the new v4 database, remembering to name it with .sql suffix.

In between tries, you will need to completely clear the target database:

```
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO strapi_v4_[tag]_user;
```

Restore the database using the backup. You may need to fix any inconsistencies in the data by going back to the migrated database and deleting anything the import script complains about, for example level_module links where the module has been deleted.

## Reminder to update roles

The role permission will need updating: http://localhost:1337/admin/settings/users-permissions/roles/1

## Deploying changes

N.B. we have updated to use yarn so the Render setting will need updating.

Update ENVs

Sync the workbook to create a new database called strapi-v4


