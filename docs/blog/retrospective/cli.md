---
title: The first five minutes
sidebarTitle: CLI
date: 2026-10-27
description: >-
    Starting a KosmoJS project used to take two runs, seven questions, two installs, and ended on a 404.
    Today it is three questions and a working page. No question got better. They just stopped being asked.
head:
  - - meta
    - name: keywords
      content: create kosmo, npm create kosmo, kosmo cli, project scaffolding,
        kosmo folder, developer experience, first run
tags: retrospective, cli, dx
---

A framework gets judged in the first five minutes.

Not by its routing, or its validation, or its middleware.
By the commands you type before the first page shows up.
And by whether a page shows up at all.

For most of the year, KosmoJS did not do well in those five minutes.

## Two runs, seven questions

In November, a project started like this:

~~~sh
npx kosmojs
~~~

It asked for an app name and a dist directory, and created a project with nothing in it.
No source folder. On purpose.

The docs were proud of it:
*"Unlike standard Vite templates, KosmoJS doesn't create a source folder immediately."*
A KosmoJS project is several apps, so it felt right to let you add them yourself.

So you ran it again, from inside the project:

~~~sh
cd ./my-app
npx kosmojs
~~~

And answered five more questions.
The folder name, with an `@` in front of it. The framework. SSR or not.
The base URL. The port.

Seven questions, two runs, before a single file of yours existed.

## The install dance

A week later the second run became a task inside the project:

~~~sh
npx kosmojs app
cd ./app
pnpm install
pnpm +folder
pnpm install
pnpm dev
~~~

Yes, `pnpm install` twice.
The folder could pull in its own framework dependencies, so the README said, quite honestly,
*"Run the package manager again."*

Six commands. And at the end of them, nothing to look at,
because there were no routes yet.

That dance lasted until late August.

## Getting a normal name

January brought the first fix, and it was only a name.

The package became `create-kosmo`, so a project started the way npm users already expect:

~~~sh
npm create kosmo
~~~

Same questions. Same two steps. But at least the first command looked familiar.

## Questions that answered themselves

After that, the questions started disappearing, one at a time.
Each one went away when the framework learned its answer.

**The port went first.**
In March the dev server became one process for every folder, on one port.
A folder no longer had a port of its own, so there was nothing to ask.

**Then the CLI started to look like a CLI.**
August, `@clack/prompts`. Real prompts, real select lists, a clean cancel on ctrl-c.
It changed nothing about the questions. It changed everything about how it felt to answer them.

**Then the first folder came with the project.**
Late August. The project and its first source folder, `app`, in one run.
One install. The dance was over.

You could bootstrap into the current directory too, with `.`,
which is what you want right after `git clone` of an empty repo.

**Then the questions stopped being unconditional.**
SSG was asked only if SSR was on.
SSR, SSG and TanStack Query were asked only if there was a frontend.
Why ask an API-only folder whether it wants server-side rendering?

**Then the base URL went.**
September, the declarative config.
A folder's base became its name: `admin` lives at `/admin`, its API at `/admin/api`.
The first folder, `app`, takes the root: `/` and `/api`.

**And then SSR, SSG and TanStack went too.**
The declarative config already had defaults for all three.
SSR on, SSG off, TanStack off.

The CLI was asking questions the config already knew the answers to,
and flipping one later is a single key in `kosmo.config.ts`.
So the CLI stopped asking.

## Three questions

Today it looks like this:

~~~sh
npm create kosmo
~~~

A name, a frontend, a backend. That's it.

The name can come as a flag, `--name`, and so can the rest,
so a script or an agent can create a project without a single prompt.
Leave any of them out and you get asked.

And creating a project writes very little.
The dev server writes the rest on its first start:
it seeds the files, wires everything together, then starts watching your routes.

~~~sh
cd ./my-app
npm install
npm run dev
~~~

Four commands. One install.

## And then, a page

The last piece arrived in October, in `0.6.4`.

Everything above still ended on an empty project.
No routes, so `localhost:4556` answered with a 404.
The setup was faster, but the welcome was the same.

Now a new source folder is seeded with a default index page,
and a default API route when it has a backend.
The first thing you see is something that works.

That should have been there in November.

## What it taught me

No question got better this year. They just got fewer.

Every question a CLI asks is a decision the framework has not made yet.
Some are real decisions, and those belong to you: the name, the frontend, the backend.
The rest were decisions I hadn't made yet, so I handed them to you instead.

The port. The base. SSR, SSG, TanStack.
Each one went away the moment the framework could answer it on its own,
and every answer is still one key away in `kosmo.config.ts`.

Seven questions became three. Two runs became one. Two installs became one.
And a 404 became a page.

Five minutes is now about one.
