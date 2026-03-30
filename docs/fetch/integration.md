---
title: Fetch Client Integration
description: Integrate KosmoJS fetch clients with SolidJS createResource,
    React hooks, and custom state management patterns. Type safety flows through all framework abstractions.
head:
  - - meta
    - name: keywords
      content: solidjs integration, react hooks, createResource, custom hooks,
        fetch client integration, state management, promise handling, typescript hooks
---

The fetch client returns standard promises, so it fits naturally into whatever async pattern your framework uses.

::: code-group
```ts [SolidJS]
import { createResource } from "solid-js";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

function UserProfile(props) {
  const [user] = createResource(() => props.userId, (id) => GET([id]));

  return (
    <div>
      {user.loading && <div>Loading...</div>}
      {user() && <div>{user().name}</div>}
    </div>
  );
}
```

```ts [React]
import { useState, useEffect } from "react";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

function useUser(userId: number) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    GET([userId])
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}
```
:::

Types flow through these abstractions - hooks and components automatically know the response shape
from your API definition.
