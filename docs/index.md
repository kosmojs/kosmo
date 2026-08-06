---
# the default theme's shell: real nav, no sidebar, no doc styling
layout: page
sidebar: false
# the landing brings its own footer, so suppress themeConfig.footer here
footer: false
# scopes landing/landing.css - see the note at the top of that file
pageClass: landing
title: KosmoJS
titleTemplate: ':title - the composable meta-framework'
description: KosmoJS is a full-stack meta-framework for building several apps in a scalable codebase.
    Each gets its own backend and frontend framework and its own routes,
    sharing one install, one set of types, one build. Built on Vite.
head:
  - - meta
    - property: og:title
      content: KosmoJS - many apps, one project, zero glue
  - - meta
    - property: og:description
      content: A full-stack meta-framework for building several apps in one codebase. Built on Vite.
---

<script setup>
import Hero from "./.vitepress/theme/landing/Hero.vue";
import Problem from "./.vitepress/theme/landing/Problem.vue";
import SourceFolders from "./.vitepress/theme/landing/SourceFolders.vue";
import CoreLoop from "./.vitepress/theme/landing/CoreLoop.vue";
import Features from "./.vitepress/theme/landing/Features.vue";
import Philosophy from "./.vitepress/theme/landing/Philosophy.vue";
import FinalCta from "./.vitepress/theme/landing/FinalCta.vue";
import SiteFooter from "./.vitepress/theme/landing/SiteFooter.vue";
</script>

<Hero />
<Problem />
<SourceFolders />
<CoreLoop />
<Features />
<Philosophy />
<FinalCta />
<SiteFooter />
