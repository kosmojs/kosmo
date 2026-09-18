Shared "Agents versions" blocks - included once per multi-framework page, at the
bottom, after an `---` delimiter:

    <!--@include: @/parts/agents-versions.md#backend-->

Regions: `#backend`, `#frontend`, `#all`. This file is not a page (`srcExclude`)
and stays out of the llms artifacts; the flatten script strips the included blocks
from the text artifacts either way.

<!-- #region backend -->
::: details Agents versions
Single-framework, self-contained versions of this page's snippets:
<span class="text-nowrap">
[Hono](/agents/hono) · [H3](/agents/h3) · [Koa](/agents/koa)
</span>
:::
<!-- #endregion backend -->

<!-- #region frontend -->
::: details Agents versions
Single-framework, self-contained versions of this page's snippets:
<span class="text-nowrap">
[React](/agents/react) · [Solid](/agents/solid) · [Vue](/agents/vue) ·
[Svelte](/agents/svelte) · [MDX](/agents/mdx)
</span>
:::
<!-- #endregion frontend -->

<!-- #region all -->
::: details Agents versions
Single-framework, self-contained versions of this page's snippets:
<span class="text-nowrap">
[Hono](/agents/hono) · [H3](/agents/h3) · [Koa](/agents/koa) · [React](/agents/react) ·
</span>
<span class="text-nowrap">
[Solid](/agents/solid) · [Vue](/agents/vue) · [Svelte](/agents/svelte) · [MDX](/agents/mdx)
</span>
:::
<!-- #endregion all -->
