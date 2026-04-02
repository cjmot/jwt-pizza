# Local Staging Environment Using GitHub Actions

### Background

I chose this topic because I saw a lot of people (including myself) struggling to debug their production environment.
A common theme I saw was the classic "well it was working locally",
and I wanted to find a better way to debug a production-like environment than waiting minutes for their code to get
deployed in aws,
only to find out that their fix didn't actually fix anything and now having to wait another 5 minutes for the next small
fix to deploy.
This consumes unnecessary resources and only leads to frustration.

### Idea

In a real enterprise level software stack there will be at least a staging environment apart from production used for
testing, and sometimes even a review environment.
I wanted to mimic that workflow so that I didn't have to wait minutes for deployments to happen before I could test
fixes.
To do this, I decided to use GitHub Actions to deploy a container on my own machine that would mimic my
staging/production environment,
allowing to me to quickly test new features and bug fixes without having to use AWS resources and cutting the time to
debug down by a significant amount.

### Implementation

The overall implementation is as follows:

- Push a new branch to github
- GitHub Actions workflow triggers
- Self-hosted actions runner executes the job
    - Pushes a build image to the GitHub image repository
    - Pulls the image from the container and builds the container locally
- Environment is available for testing locally

This will help identify/fix issues relating to a production environment by mimicking the environment on your own
machine.

### Prerequisites

1. Self-hosted GitHub Actions Runner
   Installed on your machine (WSL recommended)
   Running and connected to your repository  
   (Docs: https://docs.github.com/actions/hosting-your-own-runners)

2. Docker Installed and Running

Make sure Docker is accessible from your runner:  
Run `docker ps` to show running containers.

If using WSL:

Ensure Docker Desktop or native Docker is correctly configured
Confirm the runner and your shell use the same Docker daemon  
Docs:

- https://docs.docker.com/engine/install/
- https://docs.github.com/actions/using-jobs/running-jobs-in-a-container

---

### Implementation Steps

1. Create a new file called `Dockerfile` in the root of your repo
1. What this will look like will depend on your repo, but here is an example Dockerfile for a vite react app:

 ```
 FROM node:20-alpine AS build
 WORKDIR /app
 
 COPY package*.json ./
 RUN npm ci
 
 COPY . .
 RUN npm run build
 
 FROM nginx:1.27-alpine AS runtime
 COPY nginx.conf /etc/nginx/conf.d/default.conf
 COPY --from=build /app/dist /usr/share/nginx/html/<app-name>
 
 EXPOSE 3000
 CMD ["nginx", "-g", "daemon off;"]
 ```

2. Note: Setting up a runtime server that gets executed with Dockerfile will vary from project to project, look for
   docs or have AI help you create what files are needed for your specific project.
2. Create a workflow file
1. In the root of your repo, create `.github/actions/review-env.yml`. This file will define the workflow for
   building an image, pushing the image to GitHub Images Registry, and pulling the image down and creating a
   container from it.
2. Here's an example of an annotated workflow file:

```
name: Branch Preview

on:
  push:
    branches-ignore:  # On pushes to any branch other than main
      - main
  delete:  # Runs when any branch is deleted (on a closed merge request)

concurrency:  # Cancels any in progress runs for the same branch and keeps only the latest one running
  group: preview-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-and-push:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    outputs:  # Defines outputs that can be referenced in future jobs
      branch_slug: ${{ steps.vars.outputs.branch_slug }}
      image_ref: ${{ steps.vars.outputs.image_ref }}
      host_port: ${{ steps.vars.outputs.host_port }}

    steps:
      - uses: actions/checkout@v4

      - name: Compute branch vars
        id: vars
        shell: bash
        run: |
          BRANCH_SLUG=$(echo "${GITHUB_REF_NAME}" | tr '/[:upper:]' '-[:lower:]' | sed 's/[^a-z0-9-]//g')
          IMAGE_REF="ghcr.io/${GITHUB_REPOSITORY,,}:${BRANCH_SLUG}"

          HASH=$(echo -n "$BRANCH_SLUG" | cksum | cut -d ' ' -f1)
          HOST_PORT=$((4000 + HASH % 1000))

          echo "branch_slug=$BRANCH_SLUG" >> "$GITHUB_OUTPUT"
          echo "image_ref=$IMAGE_REF" >> "$GITHUB_OUTPUT"
          echo "host_port=$HOST_PORT" >> "$GITHUB_OUTPUT"

      - name: Log in to GHCR  # Logs into GHCR to ensure you can push the current image to it
        run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u "${{ github.actor }}" --password-stdin

      - name: Build image  # Builds image to push
        run: docker build -t "${{ steps.vars.outputs.image_ref }}" .

      - name: Push image  # Pushes image to GHCR
        run: docker push "${{ steps.vars.outputs.image_ref }}"

  deploy-local:  # Deploys the image to your local docker environment
    if: github.event_name == 'push'
    needs: build-and-push
    runs-on: self-hosted  # Your own machine that's registered as an actions runner

    steps:
      - name: Log in to GHCR
        run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u "${{ github.actor }}" --password-stdin

      - name: Deploy preview container
        env:
          BRANCH_SLUG: ${{ needs.build-and-push.outputs.branch_slug }}
          IMAGE: ${{ needs.build-and-push.outputs.image_ref }}
          HOST_PORT: ${{ needs.build-and-push.outputs.host_port }}
        run: |
          CONTAINER_NAME="family-games-${BRANCH_SLUG}"

          docker pull "$IMAGE"
          docker rm -f "$CONTAINER_NAME" || true  # Removes any running container with the same name

          docker run -d \   # Starts new container
            --name "$CONTAINER_NAME" \
            -p "${HOST_PORT}:80" \
            "$IMAGE"

      - name: Show preview URL  # Outputs the preview URL (should be a localhost url)
        env:
          HOST_PORT: ${{ needs.build-and-push.outputs.host_port }}
        run: echo "Preview available at http://localhost:${HOST_PORT}"

  cleanup-local:  # This only runs when the branch is deleted, it gets the branch slug and removes any running review containers with the same slug
    if: github.event_name == 'delete' && github.event.ref_type == 'branch'
    runs-on: self-hosted

    steps:
      - name: Compute branch slug
        id: vars
        shell: bash
        run: |
          BRANCH_SLUG=$(echo "${{ github.event.ref }}" | tr '/[:upper:]' '-[:lower:]' | sed 's/[^a-z0-9-]//g')
          echo "branch_slug=$BRANCH_SLUG" >> "$GITHUB_OUTPUT"

      - name: Remove preview container
        env:
          BRANCH_SLUG: ${{ steps.vars.outputs.branch_slug }}
        run: |
          CONTAINER_NAME="family-games-${BRANCH_SLUG}"
          docker rm -f "$CONTAINER_NAME" || true
```

### Testing

- To test:
    - Make sure your docker environment is up and your local github actions runner is online.
    - Push a new branch to your repository
    - Look at the action run in github and wait for the review URL
        - Optional: You can look at the actions runner on your machine and see when it gets the job from github and when
          it completes.
    - Open the review URL in your browser, and you should see your app running.
    - Optional: You should be able to see the running container when you run `docker ps` in your terminal or looking at
      docker desktop if you have it.

### Some things to consider...

- Running your own github actions runner can be dangerous if your repository is public, as anyone could create and push
  a new branch to your code and run new pipelines that will run on your own machine if you're not careful about pushing
  rules.
- If running on WSL, make sure to use the same terminal that's connected to docker to run your actions.
  Otherwise, your container will be invisible when you look for it in docker (no I didn't learn this by personal
  experience, why do you ask?).
- For added security, make sure you know which actions are pending before starting your self-hosted runner so you don't
  run any unfamiliar actions, and stop your runner after the action is completed.

---

## Conclusion

This curiosity report helped me understand a lot more about docker containers and images, and how github actions work.
It also taught me more about how ci-cd pipelines work in general and how to set up docker containers using actions in an
environment other than AWS, which will be useful if working in non-cloud related systems.

