#!/usr/bin/env bash
ionic build --prod
firebase deploy --only hosting:prod --project eatmatic-143319

# firebase deploy --only functions --project delivermatic-28b9e

# ionic 4 build and deploy commands:
# ionic build browser --prod
# firebase deploy --only hosting:ionic4
