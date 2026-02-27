---
title: Generator Best Practices
description: Best practices for writing KosmoJS generators including handling incremental updates,
    using path resolvers, documenting generator behavior.
head:
  - - meta
    - name: keywords
      content: generator best practices, code generation patterns, path resolution,
        incremental updates, template design, generator documentation
---

### 💡 Writing Generators Best Practices

**Handle both initial and incremental calls.**
Check whether `event` is defined to determine the call type.

**Use path resolution helpers.**
The `pathResolver` provides consistent path construction
across `KosmoJS`'s directory structure.

**Filter route entries appropriately.**
Most generators only care about API routes or page routes, not both.

**Consider dependencies.**
Use `referencedFiles` to determine when to regenerate routes
that import from changed files.

**Keep templates simple.**
Complex logic belongs in your factory, not in Handlebars templates.
Templates should focus on structure, with data prepared by your code.

**Document your generator.**
Explain what it generates, what options it accepts,
and how to configure it.

**Test incremental updates.**
Verify that your generator correctly handles file changes
without regenerating everything unnecessarily.
