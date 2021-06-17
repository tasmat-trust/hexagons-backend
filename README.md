# Hexagons Strapi

[Strapi](https://strapi.io/) is "the leading open-source headless CMS."

Hexagons uses it for user management and authentication, as well as to manage all the content of the application.

## Deploying

This repository has been deployed to Digital Ocean using these [step-by-step instructions on the Strapi website](https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/deployment/hosting-guides/digitalocean-app-platform.html#configure-your-strapi-project-for-deployment).

Any changes to the `main` branch of this repository will trigger a deployment to Digital Ocean.

## Development strategy

There is no easy way of migrating content from one Strapi instance to another. 

Therefore, in day-to-day development, connect the local client to the deployed Strapi on Digital Ocean. Use local Strapi solely for creating Content Types and Relationships, and test these on local Strapi. Deploy them and continue local app development using content on remote Strapi.
